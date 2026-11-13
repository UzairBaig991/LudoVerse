import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBotMove } from './bot.ts';
import { PLAYER_META, createGameState, moveToken, rollForCurrentPlayer } from './ludo.ts';

test('bot only chooses a legal move', () => {
  const initial = createGameState(2);
  const state = { ...initial, turnIndex: 1, phase: 'moving', dice: 6 };
  const move = chooseBotMove(state, 'Easy', () => 0.5);
  assert.ok(state.players[1].tokens.some((token) => token.id === move && token.state === 'home'));
});

test('hard bot prioritizes a safe capture when one is available', () => {
  const initial = createGameState(2);
  const red = initial.players[0];
  const yellow = initial.players[1];
  const targetSquare = 2;
  const yellowCaptureProgress = (targetSquare - PLAYER_META.yellow.entry + 52) % 52 - 1;
  const state = {
    ...initial,
    turnIndex: 1,
    phase: 'moving',
    dice: 1,
    players: [
      { ...red, tokens: [{ ...red.tokens[0], state: 'track', progress: (targetSquare - PLAYER_META.red.entry + 52) % 52 }, ...red.tokens.slice(1)] },
      { ...yellow, tokens: [
        { ...yellow.tokens[0], state: 'track', progress: yellowCaptureProgress },
        { ...yellow.tokens[1], state: 'track', progress: 15 },
        ...yellow.tokens.slice(2),
      ] },
    ],
  };
  assert.equal(chooseBotMove(state, 'Hard'), 'yellow-1');
});

test('two medium bots complete deterministic local matches without illegal or stuck turns', () => {
  for (let seed = 1; seed <= 4; seed += 1) {
    let randomState = seed;
    const random = () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 0x1_0000_0000;
    };
    let state = createGameState(2);
    let moves = 0;

    while (!state.winner && moves < 20_000) {
      if (state.phase === 'rolling') {
        state = rollForCurrentPlayer(state, random);
      } else {
        const tokenId = chooseBotMove(state, 'Medium', random);
        assert.ok(tokenId, `seed ${seed} had a moving phase without a legal token`);
        const next = moveToken(state, tokenId);
        assert.notEqual(next, state, `seed ${seed} attempted an illegal move`);
        state = next;
      }
      moves += 1;
    }

    assert.ok(state.winner, `seed ${seed} did not finish within ${moves} game steps`);
    assert.ok(moves < 20_000);
  }
});
