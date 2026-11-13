import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL_PROGRESS,
  PLAYER_META,
  SAFE_SQUARES,
  canTokenMove,
  createGameState,
  moveToken,
  rollDie,
  rollForCurrentPlayer,
} from './ludo.ts';

test('die results stay in the range one through six', () => {
  for (let value = 0; value < 1; value += 0.01) {
    const result = rollDie(() => value);
    assert.ok(result >= 1 && result <= 6);
  }
});

test('a token leaves home only on six', () => {
  const token = createGameState().players[0].tokens[0];
  assert.equal(canTokenMove(token, 5), false);
  assert.equal(canTokenMove(token, 6), true);
});

test('a six opens a move choice and the token advances the rolled distance', () => {
  const state = rollForCurrentPlayer(createGameState(2), () => 5 / 6);
  assert.equal(state.phase, 'moving');
  const opened = moveToken(state, 'red-1');
  const oneStep = moveToken({ ...opened, dice: 1, phase: 'moving' }, 'red-1');
  assert.equal(oneStep.players[0].tokens[0].progress, 1);
});

test('a move that overshoots the goal is illegal', () => {
  const token = { id: 'red-1', color: 'red', index: 0, state: 'track', progress: GOAL_PROGRESS - 2 };
  assert.equal(canTokenMove(token, 3), false);
  assert.equal(canTokenMove(token, 2), true);
});

test('a token on a safe square cannot be captured', () => {
  const safe = [...SAFE_SQUARES][1];
  const redProgress = (safe - PLAYER_META.red.entry + 52) % 52;
  const greenProgress = (safe - PLAYER_META.green.entry + 52) % 52;
  const state = {
    ...createGameState(2),
    phase: 'moving',
    dice: 1,
    players: [
      { ...createGameState(2).players[0], tokens: [{ id: 'red-1', color: 'red', index: 0, state: 'track', progress: redProgress - 1 }, ...createGameState(2).players[0].tokens.slice(1)] },
      { ...createGameState(2).players[1], tokens: [{ id: 'green-1', color: 'green', index: 0, state: 'track', progress: greenProgress }, ...createGameState(2).players[1].tokens.slice(1)] },
    ],
  };
  const result = moveToken(state, 'red-1');
  assert.equal(result.players[1].tokens[0].state, 'track');
});

test('an opponent on an unsafe square is sent home on capture', () => {
  const target = 2;
  const redProgress = (target - PLAYER_META.red.entry + 52) % 52;
  const greenProgress = (target - PLAYER_META.green.entry + 52) % 52;
  const initial = createGameState(2);
  const state = {
    ...initial,
    phase: 'moving',
    dice: 1,
    players: [
      { ...initial.players[0], tokens: [{ id: 'red-1', color: 'red', index: 0, state: 'track', progress: redProgress - 1 }, ...initial.players[0].tokens.slice(1)] },
      { ...initial.players[1], tokens: [{ id: 'green-1', color: 'green', index: 0, state: 'track', progress: greenProgress }, ...initial.players[1].tokens.slice(1)] },
    ],
  };
  const result = moveToken(state, 'red-1');
  assert.equal(result.players[1].tokens[0].state, 'home');
  assert.equal(result.lastCapture, 'green-1');
  assert.equal(result.turnIndex, 0);
});

test('invalid token ids and moves during the wrong phase leave state unchanged', () => {
  const state = rollForCurrentPlayer(createGameState(2), () => 5 / 6);
  assert.equal(moveToken(state, 'blue-1'), state);
  assert.equal(moveToken({ ...state, phase: 'rolling' }, 'red-1').players, state.players);
});
