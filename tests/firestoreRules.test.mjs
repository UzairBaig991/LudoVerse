import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

const projectId = 'demo-ludoverse';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv?.cleanup();
});

const authenticatedDb = (uid) => testEnv.authenticatedContext(uid).firestore();
const unauthenticatedDb = () => testEnv.unauthenticatedContext().firestore();
const profile = (uid, displayName = 'Player') => ({
  uid,
  displayName,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

const seed = (path, data) => testEnv.withSecurityRulesDisabled(async (context) => {
  await setDoc(doc(context.firestore(), path), data);
});

test('users can create and update only their own valid profile', async () => {
  const alice = authenticatedDb('alice');
  await assertSucceeds(setDoc(doc(alice, 'users/alice'), profile('alice')));
  await assertSucceeds(setDoc(doc(alice, 'users/alice'), {
    ...profile('alice', 'Alice'),
    createdAt: (await getDoc(doc(alice, 'users/alice'))).data().createdAt,
  }));
  await assertFails(setDoc(doc(alice, 'users/bob'), profile('bob')));
  await assertFails(setDoc(doc(alice, 'users/alice'), { ...profile('alice'), admin: true }));
});

test('profiles cannot be read anonymously or listed', async () => {
  await seed('users/alice', profile('alice'));
  const alice = authenticatedDb('alice');
  await assertFails(getDoc(doc(unauthenticatedDb(), 'users/alice')));
  await assertFails(getDoc(doc(authenticatedDb('bob'), 'users/alice')));
  await assertFails(getDocs(collection(alice, 'users')));
});

test('only room members can read a room and clients cannot write it', async () => {
  await seed('rooms/ROOM01', { playerUids: ['alice', 'bob'], status: 'waiting' });
  await assertSucceeds(getDoc(doc(authenticatedDb('alice'), 'rooms/ROOM01')));
  await assertFails(getDoc(doc(authenticatedDb('mallory'), 'rooms/ROOM01')));
  await assertFails(getDoc(doc(unauthenticatedDb(), 'rooms/ROOM01')));
  await assertFails(setDoc(doc(authenticatedDb('alice'), 'rooms/ROOM01'), { status: 'completed' }));
});

test('only match participants can read a match and clients cannot create one', async () => {
  await seed('matches/match-1', { playerUids: ['alice', 'bob'], winnerUid: 'alice' });
  await assertSucceeds(getDoc(doc(authenticatedDb('bob'), 'matches/match-1')));
  await assertFails(getDoc(doc(authenticatedDb('mallory'), 'matches/match-1')));
  await assertFails(setDoc(doc(authenticatedDb('alice'), 'matches/fake'), { playerUids: ['alice'] }));
});

test('quick match tickets are private and server-owned', async () => {
  await seed('quickMatchTickets/alice', { status: 'waiting' });
  await assertSucceeds(getDoc(doc(authenticatedDb('alice'), 'quickMatchTickets/alice')));
  await assertFails(getDoc(doc(authenticatedDb('bob'), 'quickMatchTickets/alice')));
  await assertFails(setDoc(doc(authenticatedDb('alice'), 'quickMatchTickets/alice'), { status: 'matched' }));
});

test('unspecified collections remain inaccessible', async () => {
  await seed('privateInternal/secret', { value: 'server-owned' });
  await assertFails(getDoc(doc(authenticatedDb('alice'), 'privateInternal/secret')));
  await assertFails(setDoc(doc(authenticatedDb('alice'), 'privateInternal/new'), { value: true }));
});
