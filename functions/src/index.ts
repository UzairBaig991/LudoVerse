import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { randomInt } from 'node:crypto';
import { GameState } from '../../src/lib/ludo.js';
import { applyOnlineMove, applyOnlineRoll, getOnlineTurnUid, initializeOnlineGame, OnlineSeat } from './onlineMatch.js';
import { findOpenSeat, isValidRoomCode, makeRoomCode } from './roomLogic.js';

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;

interface RoomPlayer {
  uid: string;
  displayName: string;
  seat: number;
  ready: boolean;
}

interface Room {
  roomCode: string;
  hostUid: string;
  playerCount: number;
  playerUids: string[];
  players: RoomPlayer[];
  status: 'waiting' | 'playing';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  gameState?: GameState;
  stateVersion?: number;
  lastAction?: ActionReceipt;
}

interface ActionReceipt {
  requestId: string;
  uid: string;
  type: 'roll' | 'move';
  result: Record<string, unknown>;
}

const requireUid = (auth: { uid: string } | undefined) => {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before using private rooms.');
  return auth.uid;
};

const playerName = (name: unknown, fallback: string) => {
  const trimmed = typeof name === 'string' ? name.trim().slice(0, 24) : '';
  return trimmed || fallback;
};

const requireActionInput = (requestId: unknown, roomCodeValue: unknown, stateVersion: unknown) => {
  const roomCode = typeof roomCodeValue === 'string' ? roomCodeValue.trim().toUpperCase() : '';
  if (!isValidRoomCode(roomCode)) throw new HttpsError('invalid-argument', 'Enter a valid room code.');
  if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(requestId)) {
    throw new HttpsError('invalid-argument', 'A valid action identifier is required.');
  }
  if (!Number.isSafeInteger(stateVersion) || (stateVersion as number) < 0) {
    throw new HttpsError('invalid-argument', 'A valid game state version is required.');
  }
  return { roomCode, requestId, stateVersion: stateVersion as number };
};

const validateTurn = (room: Room, uid: string, type: 'rolling' | 'moving') => {
  if (room.status !== 'playing' || !room.gameState) {
    throw new HttpsError('failed-precondition', 'The room has not started.');
  }
  if (room.gameState.phase !== type) {
    throw new HttpsError('failed-precondition', type === 'rolling' ? 'Choose a token before rolling again.' : 'Roll the die before moving a token.');
  }
  if (getOnlineTurnUid(room.gameState, room.players as OnlineSeat[]) !== uid) {
    throw new HttpsError('permission-denied', 'It is not your turn.');
  }
  return room.gameState;
};

const duplicateActionResult = (room: Room, requestId: string, uid: string, type: ActionReceipt['type']) => {
  const previous = room.lastAction;
  if (!previous || previous.requestId !== requestId) return null;
  if (previous.uid !== uid || previous.type !== type) {
    throw new HttpsError('already-exists', 'This action identifier has already been used.');
  }
  return previous.result;
};

export const createPrivateRoom = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const playerCount = Number(request.data?.playerCount);
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4) {
    throw new HttpsError('invalid-argument', 'Choose a room size from 2 to 4 players.');
  }
  const name = playerName(request.auth?.token.name, 'Player');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = makeRoomCode();
    const roomRef = db.collection('rooms').doc(roomCode);
    const now = Timestamp.now();
    const room: Room = {
      roomCode,
      hostUid: uid,
      playerCount,
      playerUids: [uid],
      players: [{ uid, displayName: name, seat: 0, ready: true }],
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
      expiresAt: Timestamp.fromMillis(now.toMillis() + ROOM_LIFETIME_MS),
    };
    const created = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(roomRef);
      if (existing.exists) return false;
      transaction.create(roomRef, room);
      return true;
    });
    if (created) return { roomCode };
  }
  throw new HttpsError('resource-exhausted', 'Could not create a room. Please try again.');
});

export const joinPrivateRoom = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const roomCode = typeof request.data?.roomCode === 'string' ? request.data.roomCode.trim().toUpperCase() : '';
  if (!isValidRoomCode(roomCode)) throw new HttpsError('invalid-argument', 'Enter a valid 8-character room code.');
  const roomRef = db.collection('rooms').doc(roomCode);
  const joined = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'That room does not exist.');
    const room = snapshot.data() as Room;
    if (room.status !== 'waiting' || room.expiresAt.toMillis() <= Date.now()) {
      throw new HttpsError('failed-precondition', 'That room is no longer accepting players.');
    }
    if (room.playerUids.includes(uid)) return room;
    if (room.players.length >= room.playerCount) throw new HttpsError('resource-exhausted', 'That room is full.');
    const seat = findOpenSeat(room.players, room.playerCount);
    if (seat === undefined) throw new HttpsError('resource-exhausted', 'That room is full.');
    const players = [...room.players, {
      uid,
      displayName: playerName(request.auth?.token.name, 'Player'),
      seat,
      ready: false,
    }];
    transaction.update(roomRef, {
      players,
      playerUids: [...room.playerUids, uid],
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...room, players, playerUids: [...room.playerUids, uid] };
  });
  return { roomCode: joined.roomCode };
});

export const setPrivateRoomReady = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const roomCode = typeof request.data?.roomCode === 'string' ? request.data.roomCode.trim().toUpperCase() : '';
  const ready = request.data?.ready;
  if (!isValidRoomCode(roomCode) || typeof ready !== 'boolean') {
    throw new HttpsError('invalid-argument', 'A valid room code and ready state are required.');
  }
  const roomRef = db.collection('rooms').doc(roomCode);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'That room does not exist.');
    const room = snapshot.data() as Room;
    if (room.status !== 'waiting') throw new HttpsError('failed-precondition', 'This room has already started.');
    if (room.expiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'This room has expired.');
    if (!room.playerUids.includes(uid)) throw new HttpsError('permission-denied', 'You are not a member of this room.');
    transaction.update(roomRef, {
      players: room.players.map((player) => player.uid === uid ? { ...player, ready } : player),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
});

export const startPrivateRoom = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const roomCode = typeof request.data?.roomCode === 'string' ? request.data.roomCode.trim().toUpperCase() : '';
  if (!isValidRoomCode(roomCode)) throw new HttpsError('invalid-argument', 'Enter a valid room code.');
  const roomRef = db.collection('rooms').doc(roomCode);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'That room does not exist.');
    const room = snapshot.data() as Room;
    if (room.hostUid !== uid) throw new HttpsError('permission-denied', 'Only the room host can start the match.');
    if (room.status !== 'waiting') throw new HttpsError('failed-precondition', 'This room has already started.');
    if (room.expiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'This room has expired.');
    if (room.players.length < 2 || room.players.some((player) => !player.ready)) {
      throw new HttpsError('failed-precondition', 'At least two players must join and everyone must be ready.');
    }
    let gameState: GameState;
    try {
      gameState = initializeOnlineGame(room.players);
    } catch {
      throw new HttpsError('failed-precondition', 'Room seats are invalid. Recreate the room and try again.');
    }
    transaction.update(roomRef, { status: 'playing', gameState, stateVersion: 0, updatedAt: FieldValue.serverTimestamp() });
  });
  return { status: 'playing' as const };
});

export const rollOnlineDie = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const { roomCode, requestId, stateVersion } = requireActionInput(request.data?.requestId, request.data?.roomCode, request.data?.stateVersion);
  // Keep a single server-generated result if Firestore retries this transaction.
  const die = randomInt(1, 7);
  const roomRef = db.collection('rooms').doc(roomCode);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'That room does not exist.');
    const room = snapshot.data() as Room;
    const duplicate = duplicateActionResult(room, requestId, uid, 'roll');
    if (duplicate) return duplicate as { die: number; hasMove: boolean };
    if ((room.stateVersion ?? 0) !== stateVersion) throw new HttpsError('failed-precondition', 'The game changed. Wait for the board to update and try again.');
    const state = validateTurn(room, uid, 'rolling');
    const nextState = applyOnlineRoll(state, die);
    if (!nextState) throw new HttpsError('failed-precondition', 'The game cannot roll right now.');
    const result = { die, hasMove: nextState.phase === 'moving', stateVersion: stateVersion + 1 };
    transaction.update(roomRef, {
      gameState: nextState,
      stateVersion: result.stateVersion,
      lastAction: { requestId, uid, type: 'roll', result } satisfies ActionReceipt,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return result;
  });
});

export const moveOnlineToken = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const { roomCode, requestId, stateVersion } = requireActionInput(request.data?.requestId, request.data?.roomCode, request.data?.stateVersion);
  const tokenId = request.data?.tokenId;
  if (typeof tokenId !== 'string' || !/^(red|green|yellow|blue)-[1-4]$/.test(tokenId)) {
    throw new HttpsError('invalid-argument', 'Choose a valid token.');
  }
  const roomRef = db.collection('rooms').doc(roomCode);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'That room does not exist.');
    const room = snapshot.data() as Room;
    const duplicate = duplicateActionResult(room, requestId, uid, 'move');
    if (duplicate) return duplicate as { captured: boolean; winner: string | null };
    if ((room.stateVersion ?? 0) !== stateVersion) throw new HttpsError('failed-precondition', 'The game changed. Wait for the board to update and try again.');
    const state = validateTurn(room, uid, 'moving');
    const nextState = applyOnlineMove(state, tokenId);
    if (!nextState) throw new HttpsError('invalid-argument', 'That token cannot move with this roll.');
    const result = { captured: nextState.lastCapture !== null, winner: nextState.winner, stateVersion: stateVersion + 1 };
    transaction.update(roomRef, {
      gameState: nextState,
      stateVersion: result.stateVersion,
      lastAction: { requestId, uid, type: 'move', result } satisfies ActionReceipt,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return result;
  });
});
