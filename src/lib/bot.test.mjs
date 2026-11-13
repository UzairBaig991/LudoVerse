import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBotMove } from './bot.ts';
import { PLAYER_META, createGameState } from './ludo.ts';

test('bot only chooses a legal move', () => {
  const initial = createGameState(2);
  const state = { ...initial, turnIndex: 1, phase: 'moving', dice: 6 };
  const move = chooseBotMove(state, 'Easy', () => 0.5);
  assert.ok(state.players[1].tokens.some((token) => token.id === move && token.state === 'home'));
});

test('hard bot prioritizes a safe capture when one is available', () => {
  const initial = createGameState(2);
  const red = initial.players[0];
  const green = initial.players[1];
  const targetSquare = 2;
  const greenCaptureProgress = (targetSquare - PLAYER_META.green.entry + 52) % 52 - 1;
  const state = {
    ...initial,
    turnIndex: 1,
    phase: 'moving',
    dice: 1,
    players: [
      { ...red, tokens: [{ ...red.tokens[0], state: 'track', progress: (targetSquare - PLAYER_META.red.entry + 52) % 52 }, ...red.tokens.slice(1)] },
      { ...green, tokens: [
        { ...green.tokens[0], state: 'track', progress: greenCaptureProgress },
        { ...green.tokens[1], state: 'track', progress: 5 },
        ...green.tokens.slice(2),
      ] },
    ],
  };
  assert.equal(chooseBotMove(state, 'Hard'), 'green-1');
});
