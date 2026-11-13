import test from 'node:test';
import assert from 'node:assert/strict';
import { canResumeRoom, CODE_ALPHABET, findOpenSeat, isValidRoomCode, makeRoomCode } from '../lib/functions/src/roomLogic.js';

test('room code alphabet excludes ambiguous characters and has enough symbols', () => {
  assert.equal(CODE_ALPHABET.length, 32);
  assert.match(CODE_ALPHABET, /^[A-HJ-NP-Z2-9]+$/);
  assert.equal(new Set(CODE_ALPHABET).size, CODE_ALPHABET.length);
  const code = makeRoomCode();
  assert.equal(code.length, 8);
  assert.equal(isValidRoomCode(code), true);
  assert.equal(isValidRoomCode('ABCD0OIL'), false);
  assert.equal(isValidRoomCode('TOO-SHORT'), false);
});

test('room seats stay within the configured capacity', () => {
  for (const capacity of [2, 3, 4]) {
    const players = Array.from({ length: capacity }, (_, seat) => ({ seat }));
    assert.equal(findOpenSeat(players, capacity), undefined);
  }
  assert.equal(findOpenSeat([{ seat: 0 }, { seat: 2 }], 4), 1);
});

test('existing room members can resume active and completed rooms but not expired lobbies', () => {
  assert.equal(canResumeRoom('playing', 'a', ['a', 'b'], 0, 100), true);
  assert.equal(canResumeRoom('completed', 'a', ['a', 'b'], 0, 100), true);
  assert.equal(canResumeRoom('waiting', 'a', ['a', 'b'], 200, 100), true);
  assert.equal(canResumeRoom('waiting', 'a', ['a', 'b'], 100, 100), false);
  assert.equal(canResumeRoom('playing', 'outsider', ['a', 'b'], 1000, 100), false);
});
