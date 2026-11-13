export type ColorKey = 'red' | 'green' | 'yellow' | 'blue';
export type TokenState = 'home' | 'track' | 'finish';

export interface Token {
  id: string;
  color: ColorKey;
  index: number;
  state: TokenState;
  /** Steps traveled from this player's entry square. */
  progress: number;
}

export interface PlayerState {
  id: ColorKey;
  name: string;
  tokens: Token[];
}

export interface GameRules {
  extraTurnOnSix: boolean;
  extraTurnOnCapture: boolean;
}

export interface GameState {
  players: PlayerState[];
  turnIndex: number;
  dice: number | null;
  winner: ColorKey | null;
  phase: 'rolling' | 'moving' | 'complete';
  lastCapture: string | null;
}

export const DEFAULT_RULES: GameRules = {
  extraTurnOnSix: true,
  extraTurnOnCapture: true,
};

export const TRACK_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 6;
export const GOAL_PROGRESS = TRACK_LENGTH + HOME_STRETCH_LENGTH - 1;
export const PLAYER_ORDER: ColorKey[] = ['red', 'green', 'yellow', 'blue'];
export const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const PLAYER_META: Record<ColorKey, { name: string; accent: string; home: { x: number; y: number }[]; entry: number }> = {
  red: { name: 'Red', accent: '#F44336', home: [{ x: 20, y: 20 }, { x: 32, y: 20 }, { x: 20, y: 32 }, { x: 32, y: 32 }], entry: 0 },
  green: { name: 'Green', accent: '#4CAF50', home: [{ x: 68, y: 20 }, { x: 80, y: 20 }, { x: 68, y: 32 }, { x: 80, y: 32 }], entry: 13 },
  yellow: { name: 'Yellow', accent: '#FFC107', home: [{ x: 20, y: 68 }, { x: 32, y: 68 }, { x: 20, y: 80 }, { x: 32, y: 80 }], entry: 26 },
  blue: { name: 'Blue', accent: '#2196F3', home: [{ x: 68, y: 68 }, { x: 80, y: 68 }, { x: 68, y: 80 }, { x: 80, y: 80 }], entry: 39 },
};

// A clockwise 15 × 15 board loop. Coordinates are cell centers normalized to percentages.
const TRACK_GRID: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
];

const toPercent = (cell: number) => ((cell + 0.5) / 15) * 100;
export const TRACK: { x: number; y: number }[] = TRACK_GRID.map(([x, y]) => ({ x: toPercent(x), y: toPercent(y) }));

export const FINISH_PATH: Record<ColorKey, { x: number; y: number }[]> = {
  red: Array.from({ length: 6 }, (_, index) => ({ x: toPercent(7), y: toPercent(index + 1) })),
  green: Array.from({ length: 6 }, (_, index) => ({ x: toPercent(13 - index), y: toPercent(7) })),
  yellow: Array.from({ length: 6 }, (_, index) => ({ x: toPercent(7), y: toPercent(13 - index) })),
  blue: Array.from({ length: 6 }, (_, index) => ({ x: toPercent(index + 1), y: toPercent(7) })),
};

export const buildInitialPlayers = (playerCount = 4): PlayerState[] =>
  PLAYER_ORDER.slice(0, Math.max(2, Math.min(4, playerCount))).map((color) => ({
    id: color,
    name: PLAYER_META[color].name,
    tokens: Array.from({ length: 4 }, (_, index) => ({ id: `${color}-${index + 1}`, color, index, state: 'home' as const, progress: 0 })),
  }));

export const createGameState = (playerCount = 4): GameState => ({
  players: buildInitialPlayers(playerCount), turnIndex: 0, dice: null, winner: null, phase: 'rolling', lastCapture: null,
});

export const getTokenDisplayPosition = (token: Token) => {
  if (token.state === 'home') return PLAYER_META[token.color].home[token.index]!;
  if (token.state === 'track') {
    const trackIndex = (PLAYER_META[token.color].entry + token.progress) % TRACK_LENGTH;
    return TRACK[trackIndex]!;
  }
  return FINISH_PATH[token.color][Math.min(token.progress - TRACK_LENGTH, HOME_STRETCH_LENGTH - 1)]!;
};

export const getLegalTokens = (player: PlayerState, roll: number): Token[] =>
  player.tokens.filter((token) => canTokenMove(token, roll));

export const canTokenMove = (token: Token, roll: number): boolean => {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6 || token.state === 'finish') return false;
  if (token.state === 'home') return roll === 6;
  return token.progress + roll <= GOAL_PROGRESS;
};

export const advanceToken = (token: Token, roll: number): Token => {
  if (!canTokenMove(token, roll)) return token;
  if (token.state === 'home') return { ...token, state: 'track', progress: 0 };
  const progress = token.progress + roll;
  return progress >= TRACK_LENGTH ? { ...token, state: 'finish', progress } : { ...token, progress };
};

export const hasPlayerWon = (player: PlayerState) => player.tokens.every((token) => token.state === 'finish' && token.progress === GOAL_PROGRESS);

export const rollDie = (random: () => number = Math.random): number => Math.min(6, Math.max(1, Math.floor(random() * 6) + 1));

export const rollForCurrentPlayer = (state: GameState, random: () => number = Math.random): GameState => {
  if (state.phase !== 'rolling' || state.winner) return state;
  const dice = rollDie(random);
  const hasMoves = getLegalTokens(state.players[state.turnIndex]!, dice).length > 0;
  if (hasMoves) return { ...state, dice, phase: 'moving', lastCapture: null };
  const nextTurn = dice === 6 ? state.turnIndex : (state.turnIndex + 1) % state.players.length;
  return { ...state, dice, phase: 'rolling', turnIndex: nextTurn, lastCapture: null };
};

export const moveToken = (state: GameState, tokenId: string, rules: GameRules = DEFAULT_RULES): GameState => {
  if (state.phase !== 'moving' || state.winner || state.dice === null) return state;
  const player = state.players[state.turnIndex]!;
  const token = player.tokens.find((candidate) => candidate.id === tokenId);
  if (!token || !canTokenMove(token, state.dice)) return state;

  const movedToken = advanceToken(token, state.dice);
  const destination = movedToken.state === 'track'
    ? (PLAYER_META[player.id].entry + movedToken.progress) % TRACK_LENGTH
    : null;
  let captured: string | null = null;
  const players = state.players.map((current) => ({
    ...current,
    tokens: current.tokens.map((candidate) => {
      if (current.id === player.id && candidate.id === token.id) return movedToken;
      if (destination === null || current.id === player.id || candidate.state !== 'track') return candidate;
      const opponentSquare = (PLAYER_META[candidate.color].entry + candidate.progress) % TRACK_LENGTH;
      if (opponentSquare !== destination || SAFE_SQUARES.has(destination)) return candidate;
      captured = candidate.id;
      return { ...candidate, state: 'home' as const, progress: 0 };
    }),
  }));
  const updatedPlayer = players.find((candidate) => candidate.id === player.id)!;
  const winner = hasPlayerWon(updatedPlayer) ? player.id : null;
  const extraTurn = state.dice === 6 && rules.extraTurnOnSix || captured !== null && rules.extraTurnOnCapture;
  return {
    ...state,
    players,
    winner,
    phase: winner ? 'complete' : 'rolling',
    dice: null,
    turnIndex: winner || extraTurn ? state.turnIndex : (state.turnIndex + 1) % state.players.length,
    lastCapture: captured,
  };
};
