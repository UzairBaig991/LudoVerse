import test from 'node:test';
import assert from 'node:assert/strict';
import { CODE_ALPHABET, findOpenSeat, isValidRoomCode, makeRoomCode } from '../lib/roomLogic.js';

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
