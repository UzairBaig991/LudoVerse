import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
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
}

const requireUid = (auth: { uid: string } | undefined) => {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before using private rooms.');
  return auth.uid;
};

const playerName = (name: unknown, fallback: string) => {
  const trimmed = typeof name === 'string' ? name.trim().slice(0, 24) : '';
  return trimmed || fallback;
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
    transaction.update(roomRef, { status: 'playing', updatedAt: FieldValue.serverTimestamp() });
  });
  return { status: 'playing' as const };
});
