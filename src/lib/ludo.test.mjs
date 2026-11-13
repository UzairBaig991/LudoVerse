import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL_PROGRESS,
  PLAYER_META,
  SAFE_SQUARES,
  TRACK,
  DEFAULT_RULES,
  FINISH_PATH,
  advanceToken,
  canTokenMove,
  createGameState,
  hasPlayerWon,
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

test('the board loop has 52 unique cells and finishing requires the exact number', () => {
  assert.equal(TRACK.length, 52);
  assert.equal(new Set(TRACK.map(({ x, y }) => `${x},${y}`)).size, 52);
  const lastStep = { id: 'red-1', color: 'red', index: 0, state: 'track', progress: GOAL_PROGRESS - 1 };
  assert.equal(canTokenMove(lastStep, 1), true);
  const finished = advanceToken(lastStep, 1);
  assert.equal(finished.state, 'finish');
  assert.equal(hasPlayerWon({ id: 'red', name: 'Red', tokens: Array.from({ length: 4 }, (_, index) => ({ ...finished, id: `red-${index + 1}`, index })) }), true);
});

test('two-player matches use opposite red and yellow starting seats', () => {
  const game = createGameState(2);
  assert.deepEqual(game.players.map((player) => player.id), ['red', 'yellow']);
  assert.equal((PLAYER_META.yellow.entry - PLAYER_META.red.entry + 52) % 52, 26);
});

test('each color starts on a safe square and enters its aligned six-cell home lane', () => {
  for (const color of ['red', 'green', 'yellow', 'blue']) {
    const entry = PLAYER_META[color].entry;
    const previous = TRACK[(entry + TRACK.length - 1) % TRACK.length];
    const firstHomeCell = FINISH_PATH[color][0];
    const distance = Math.abs(previous.x - firstHomeCell.x) + Math.abs(previous.y - firstHomeCell.y);
    assert.ok(SAFE_SQUARES.has(entry), `${color} start must be safe`);
    assert.equal(FINISH_PATH[color].length, 6);
    assert.ok(Math.abs(distance - 100 / 15) < 0.001, `${color} home lane should connect to the shared track`);
  }
});

test('a third consecutive six forfeits that roll and passes the turn', () => {
  let state = createGameState(2);
  state = rollForCurrentPlayer(state, () => 5 / 6);
  state = moveToken(state, 'red-1');
  state = rollForCurrentPlayer(state, () => 5 / 6);
  state = moveToken(state, 'red-2');
  assert.equal(state.consecutiveSixes, 2);

  const thirdSix = rollForCurrentPlayer(state, () => 5 / 6);
  assert.equal(thirdSix.turnIndex, 1);
  assert.equal(thirdSix.phase, 'rolling');
  assert.equal(thirdSix.consecutiveSixes, 0);
  assert.equal(thirdSix.players[0].tokens[0].state, 'track');
  assert.equal(thirdSix.players[0].tokens[1].state, 'track');
  assert.equal(thirdSix.players[0].tokens[2].state, 'home');
});

test('a non-six roll resets the consecutive-six counter', () => {
  let state = rollForCurrentPlayer(createGameState(2), () => 5 / 6);
  state = moveToken(state, 'red-1');
  const nextRoll = rollForCurrentPlayer(state, () => 0);
  assert.equal(nextRoll.consecutiveSixes, 0);
  assert.equal(nextRoll.phase, 'moving');
});

test('the three-sixes penalty can be disabled by a selected ruleset', () => {
  const state = { ...createGameState(2), consecutiveSixes: 2 };
  const result = rollForCurrentPlayer(state, () => 5 / 6, { ...DEFAULT_RULES, threeSixesLoseTurn: false });
  assert.equal(result.turnIndex, 0);
  assert.equal(result.phase, 'moving');
  assert.equal(result.consecutiveSixes, 3);
});

test('tokens continue moving through the six home-lane cells before finishing', () => {
  const laneToken = { id: 'red-1', color: 'red', index: 0, state: 'track', progress: 52 };
  const nextCell = advanceToken(laneToken, 4);
  assert.equal(nextCell.state, 'track');
  assert.equal(nextCell.progress, 56);
  assert.equal(canTokenMove(nextCell, 2), false);
  const goal = advanceToken(nextCell, 1);
  assert.equal(goal.state, 'finish');
  assert.equal(goal.progress, GOAL_PROGRESS);
});

test('a token on a safe square cannot be captured', () => {
  const safe = [...SAFE_SQUARES][1];
  const redProgress = (safe - PLAYER_META.red.entry + 52) % 52;
  const yellowProgress = (safe - PLAYER_META.yellow.entry + 52) % 52;
  const state = {
    ...createGameState(2),
    phase: 'moving',
    dice: 1,
    players: [
      { ...createGameState(2).players[0], tokens: [{ id: 'red-1', color: 'red', index: 0, state: 'track', progress: redProgress - 1 }, ...createGameState(2).players[0].tokens.slice(1)] },
      { ...createGameState(2).players[1], tokens: [{ id: 'yellow-1', color: 'yellow', index: 0, state: 'track', progress: yellowProgress }, ...createGameState(2).players[1].tokens.slice(1)] },
    ],
  };
  const result = moveToken(state, 'red-1');
  assert.equal(result.players[1].tokens[0].state, 'track');
});

test('an opponent on an unsafe square is sent home on capture', () => {
  const target = 2;
  const redProgress = (target - PLAYER_META.red.entry + 52) % 52;
  const yellowProgress = (target - PLAYER_META.yellow.entry + 52) % 52;
  const initial = createGameState(2);
  const state = {
    ...initial,
    phase: 'moving',
    dice: 1,
    players: [
      { ...initial.players[0], tokens: [{ id: 'red-1', color: 'red', index: 0, state: 'track', progress: redProgress - 1 }, ...initial.players[0].tokens.slice(1)] },
      { ...initial.players[1], tokens: [{ id: 'yellow-1', color: 'yellow', index: 0, state: 'track', progress: yellowProgress }, ...initial.players[1].tokens.slice(1)] },
    ],
  };
  const result = moveToken(state, 'red-1');
  assert.equal(result.players[1].tokens[0].state, 'home');
  assert.equal(result.lastCapture, 'yellow-1');
  assert.equal(result.turnIndex, 0);
});

test('invalid token ids and moves during the wrong phase leave state unchanged', () => {
  const state = rollForCurrentPlayer(createGameState(2), () => 5 / 6);
  assert.equal(moveToken(state, 'blue-1'), state);
  assert.equal(moveToken({ ...state, phase: 'rolling' }, 'red-1').players, state.players);
});
