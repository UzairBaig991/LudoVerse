import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { randomInt } from 'node:crypto';
import { GameState } from '../../src/lib/ludo.js';
import { applyOnlineMove, applyOnlineRoll, buildOnlineMatchRecord, getOnlineTurnUid, initializeOnlineGame, OnlineSeat } from './onlineMatch.js';
import { canResumeRoom, findOpenSeat, isValidRoomCode, makeRoomCode, QuickMatchPlayer, takeQuickMatchPlayers } from './roomLogic.js';

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const ROOM_LIFETIME_MS = 2 * 60 * 60 * 1000;
const QUICK_MATCH_TICKET_LIFETIME_MS = 2 * 60 * 1000;

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
  status: 'waiting' | 'playing' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  gameState?: GameState;
  stateVersion?: number;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  lastAction?: ActionReceipt;
}

interface ActionReceipt {
  requestId: string;
  uid: string;
  type: 'roll' | 'move';
  result: Record<string, unknown>;
}

interface QuickMatchQueue {
  playerCount: number;
  waitingPlayers: QuickMatchPlayer[];
  updatedAt: Timestamp;
}

interface QuickMatchTicket {
  uid: string;
  displayName: string;
  playerCount: number;
  status: 'waiting' | 'matched' | 'expired';
  roomCode?: string;
  position?: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;
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
    if (canResumeRoom(room.status, uid, room.playerUids, room.expiresAt.toMillis(), Date.now())) {
      return room;
    }
    if (room.playerUids.includes(uid)) throw new HttpsError('failed-precondition', 'That room has expired.');
    if (room.status !== 'waiting' || room.expiresAt.toMillis() <= Date.now()) {
      throw new HttpsError('failed-precondition', 'That room is no longer accepting players.');
    }
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

export const findQuickMatch = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const playerCount = request.data?.playerCount;
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4) {
    throw new HttpsError('invalid-argument', 'Choose a quick match size from 2 to 4 players.');
  }
  const name = playerName(request.auth?.token.name, 'Player');
  const queueRef = db.collection('quickMatchQueues').doc(String(playerCount));
  const ticketRef = db.collection('quickMatchTickets').doc(uid);
  const generatedRoomCode = makeRoomCode();
  const now = Timestamp.now();
  const ticketExpiry = Timestamp.fromMillis(now.toMillis() + QUICK_MATCH_TICKET_LIFETIME_MS);

  return db.runTransaction(async (transaction) => {
    const [queueSnapshot, ticketSnapshot] = await Promise.all([
      transaction.get(queueRef),
      transaction.get(ticketRef),
    ]);
    const currentTicket = ticketSnapshot.exists ? ticketSnapshot.data() as QuickMatchTicket : null;

    if (currentTicket?.status === 'matched' && currentTicket.roomCode) {
      const priorRoomSnapshot = await transaction.get(db.collection('rooms').doc(currentTicket.roomCode));
      if (priorRoomSnapshot.exists && priorRoomSnapshot.get('status') !== 'completed') {
        return { status: 'matched' as const, roomCode: currentTicket.roomCode };
      }
    }

    if (currentTicket?.status === 'waiting' && currentTicket.expiresAt.toMillis() > now.toMillis()) {
      const existingQueue = queueSnapshot.exists ? queueSnapshot.data() as QuickMatchQueue : null;
      const position = existingQueue?.waitingPlayers.findIndex((player) => player.uid === uid) ?? -1;
      return { status: 'waiting' as const, position: Math.max(1, position + 1), expiresAt: currentTicket.expiresAt.toMillis() };
    }

    const existingQueue = queueSnapshot.exists ? queueSnapshot.data() as QuickMatchQueue : null;
    const queuedPlayers = Array.isArray(existingQueue?.waitingPlayers) ? existingQueue.waitingPlayers : [];
    const queuedUids = [...new Set(queuedPlayers.map((player) => player.uid).filter((queuedUid) => queuedUid !== uid))];
    const queuedTicketSnapshots = await Promise.all(queuedUids.map((queuedUid) =>
      transaction.get(db.collection('quickMatchTickets').doc(queuedUid)),
    ));
    const ticketByUid = new Map<string, QuickMatchTicket>();
    const staleTicketSnapshots: Array<{ uid: string; data: QuickMatchTicket }> = [];
    const activePlayers: QuickMatchPlayer[] = [];
    queuedTicketSnapshots.forEach((snapshot, index) => {
      const queuedUid = queuedUids[index]!;
      const queuedTicket = snapshot.exists ? snapshot.data() as QuickMatchTicket : null;
      if (!queuedTicket || queuedTicket.status !== 'waiting' || queuedTicket.playerCount !== playerCount
        || queuedTicket.expiresAt.toMillis() <= now.toMillis()) {
        if (queuedTicket?.status === 'waiting') staleTicketSnapshots.push({ uid: queuedUid, data: queuedTicket });
        return;
      }
      ticketByUid.set(queuedUid, queuedTicket);
      activePlayers.push({ uid: queuedUid, displayName: queuedTicket.displayName });
    });
    activePlayers.push({ uid, displayName: name });

    const selection = takeQuickMatchPlayers(activePlayers, playerCount);
    const matchRoomRef = db.collection('rooms').doc(generatedRoomCode);
    if (selection) {
      const roomCollision = await transaction.get(matchRoomRef);
      if (roomCollision.exists) throw new HttpsError('resource-exhausted', 'Could not reserve a match room. Please try again.');
    }

    for (const staleTicket of staleTicketSnapshots) {
      transaction.update(db.collection('quickMatchTickets').doc(staleTicket.uid), {
        status: 'expired',
        updatedAt: now,
      });
    }

    if (selection) {
      const matchedPlayers = selection.matched;
      const roomPlayers = matchedPlayers.map((player, seat) => ({
        ...player,
        seat,
        ready: true,
      }));
      const roomExpiry = Timestamp.fromMillis(now.toMillis() + ROOM_LIFETIME_MS);
      const gameState = initializeOnlineGame(roomPlayers);
      transaction.create(matchRoomRef, {
        roomCode: generatedRoomCode,
        hostUid: roomPlayers[0]!.uid,
        playerCount,
        playerUids: roomPlayers.map((player) => player.uid),
        players: roomPlayers,
        status: 'playing',
        gameState,
        stateVersion: 0,
        createdAt: now,
        updatedAt: now,
        startedAt: now,
        expiresAt: roomExpiry,
      });
      for (const player of matchedPlayers) {
        const priorTicket = ticketByUid.get(player.uid);
        transaction.set(db.collection('quickMatchTickets').doc(player.uid), {
          uid: player.uid,
          displayName: player.displayName,
          playerCount,
          status: 'matched',
          roomCode: generatedRoomCode,
          createdAt: priorTicket?.createdAt ?? now,
          updatedAt: now,
          expiresAt: roomExpiry,
        });
      }
      transaction.set(queueRef, {
        playerCount,
        waitingPlayers: selection.waiting,
        updatedAt: now,
      });
      return { status: 'matched' as const, roomCode: generatedRoomCode };
    }

    transaction.set(queueRef, { playerCount, waitingPlayers: activePlayers, updatedAt: now });
    transaction.set(ticketRef, {
      uid,
      displayName: name,
      playerCount,
      status: 'waiting',
      position: activePlayers.length,
      createdAt: now,
      updatedAt: now,
      expiresAt: ticketExpiry,
    });
    return { status: 'waiting' as const, position: activePlayers.length, expiresAt: ticketExpiry.toMillis() };
  });
});

export const cancelQuickMatch = onCall(async (request) => {
  const uid = requireUid(request.auth);
  const ticketRef = db.collection('quickMatchTickets').doc(uid);
  return db.runTransaction(async (transaction) => {
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists) return { status: 'cancelled' as const };
    const ticket = ticketSnapshot.data() as QuickMatchTicket;
    if (ticket.status === 'matched' && ticket.roomCode) {
      return { status: 'matched' as const, roomCode: ticket.roomCode };
    }
    if (ticket.status === 'waiting') {
      const queueRef = db.collection('quickMatchQueues').doc(String(ticket.playerCount));
      const queueSnapshot = await transaction.get(queueRef);
      const queue = queueSnapshot.exists ? queueSnapshot.data() as QuickMatchQueue : null;
      if (queue && Array.isArray(queue.waitingPlayers)) {
        transaction.set(queueRef, {
          playerCount: ticket.playerCount,
          waitingPlayers: queue.waitingPlayers.filter((player) => player.uid !== uid),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    transaction.delete(ticketRef);
    return { status: 'cancelled' as const };
  });
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
    transaction.update(roomRef, {
      status: 'playing',
      gameState,
      stateVersion: 0,
      startedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
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
    if (duplicate) return duplicate as { captured: boolean; winner: string | null; stateVersion: number };
    if ((room.stateVersion ?? 0) !== stateVersion) throw new HttpsError('failed-precondition', 'The game changed. Wait for the board to update and try again.');
    const state = validateTurn(room, uid, 'moving');
    const nextState = applyOnlineMove(state, tokenId);
    if (!nextState) throw new HttpsError('invalid-argument', 'That token cannot move with this roll.');
    const result = { captured: nextState.lastCapture !== null, winner: nextState.winner, stateVersion: stateVersion + 1 };
    if (nextState.winner) {
      const matchRef = db.collection('matches').doc(roomCode);
      const matchSnapshot = await transaction.get(matchRef);
      if (matchSnapshot.exists) throw new HttpsError('already-exists', 'This match result has already been recorded.');
      let matchRecord;
      try {
        matchRecord = buildOnlineMatchRecord(roomCode, room.hostUid, room.players, nextState);
      } catch {
        throw new HttpsError('failed-precondition', 'The winning player could not be matched to a room seat.');
      }
      transaction.create(matchRef, {
        ...matchRecord,
        startedAt: room.startedAt ?? room.createdAt,
        completedAt: FieldValue.serverTimestamp(),
      });
    }
    transaction.update(roomRef, {
      ...(nextState.winner ? { status: 'completed' as const, completedAt: FieldValue.serverTimestamp() } : {}),
      gameState: nextState,
      stateVersion: result.stateVersion,
      lastAction: { requestId, uid, type: 'move', result } satisfies ActionReceipt,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return result;
  });
});
