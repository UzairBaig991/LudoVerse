import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOnlineMove, applyOnlineRoll, getOnlineTurnUid, initializeOnlineGame } from '../lib/functions/src/onlineMatch.js';

const seats = [
  { uid: 'host-uid', displayName: 'Host', seat: 0 },
  { uid: 'guest-uid', displayName: 'Guest', seat: 1 },
];

test('online match uses room membership for player names and active-turn identity', () => {
  const game = initializeOnlineGame(seats);
  assert.deepEqual(game.players.map((player) => player.name), ['Host', 'Guest']);
  assert.equal(getOnlineTurnUid(game, seats), 'host-uid');
});

test('server applies the requested die through the shared legal-move rules', () => {
  const start = initializeOnlineGame(seats);
  const rolled = applyOnlineRoll(start, 6);
  assert.equal(rolled?.dice, 6);
  assert.equal(rolled?.phase, 'moving');
  assert.equal(applyOnlineRoll(start, 7), null);
  assert.equal(applyOnlineRoll(rolled, 4), null);
  assert.equal(applyOnlineMove(rolled, 'green-1'), null);
  const moved = applyOnlineMove(rolled, 'red-1');
  assert.equal(moved?.players[0]?.tokens[0]?.state, 'track');
  assert.equal(moved?.phase, 'rolling');
  assert.equal(moved?.turnIndex, 0);
});

test('online seats must be contiguous and valid before a match can start', () => {
  assert.throws(() => initializeOnlineGame([{ uid: 'a', displayName: 'A', seat: 1 }, { uid: 'b', displayName: 'B', seat: 2 }]), /contiguous/);
});
