import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseApp, firebaseAuth, firestore, isFirebaseConfigured } from '../firebase/client';

export interface PrivateRoomPlayer {
  uid: string;
  displayName: string;
  seat: number;
  ready: boolean;
}

export interface PrivateRoom {
  roomCode: string;
  hostUid: string;
  playerCount: number;
  playerUids: string[];
  players: PrivateRoomPlayer[];
  status: 'waiting' | 'playing';
  expiresAt?: { toMillis: () => number };
}

const requireFunctions = async () => {
  if (!isFirebaseConfigured || !firebaseApp) {
    throw new Error('Firebase is not configured. Add the project values to your local .env file first.');
  }
  if (!firebaseAuth?.currentUser) {
    throw new Error('Sign in with a Firebase account to use private rooms.');
  }
  return getFunctions(firebaseApp, 'us-central1');
};

const callRoomFunction = async <TInput extends object, TOutput>(name: string, input: TInput): Promise<TOutput> => {
  const functions = await requireFunctions();
  const callable = httpsCallable<TInput, TOutput>(functions, name);
  const response = await callable(input);
  return response.data;
};

export const createPrivateRoom = (playerCount: number) =>
  callRoomFunction<{ playerCount: number }, { roomCode: string }>('createPrivateRoom', { playerCount });

export const joinPrivateRoom = (roomCode: string) =>
  callRoomFunction<{ roomCode: string }, { roomCode: string }>('joinPrivateRoom', { roomCode });

export const setPrivateRoomReady = (roomCode: string, ready: boolean) =>
  callRoomFunction<{ roomCode: string; ready: boolean }, { ok: boolean }>('setPrivateRoomReady', { roomCode, ready });

export const startPrivateRoom = (roomCode: string) =>
  callRoomFunction<{ roomCode: string }, { status: 'playing' }>('startPrivateRoom', { roomCode });

export const subscribeToPrivateRoom = (
  roomCode: string,
  onRoom: (room: PrivateRoom | null) => void,
  onError: (error: Error) => void,
) => {
  if (!firestore || !firebaseAuth?.currentUser) {
    onError(new Error('Sign in with a Firebase account to use private rooms.'));
    return () => undefined;
  }
  return onSnapshot(doc(firestore, 'rooms', roomCode),
    (snapshot) => onRoom(snapshot.exists() ? snapshot.data() as PrivateRoom : null),
    (error) => onError(error));
};
