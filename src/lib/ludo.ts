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

// Board points are percentages so the view can scale with the available screen width.
export const TRACK: Array<{ x: number; y: number }> = [
  [50, 6], [60, 6], [70, 6], [80, 6], [88, 12], [88, 22], [88, 32], [88, 42], [88, 50],
  [80, 50], [70, 50], [60, 50], [50, 50], [40, 50], [30, 50], [20, 50], [12, 50], [12, 42],
  [12, 32], [12, 22], [12, 12], [20, 12], [30, 12], [40, 12], [50, 12], [50, 18], [50, 26],
  [50, 34], [50, 42], [44, 50], [36, 50], [28, 50], [20, 50], [20, 42], [20, 34], [20, 26],
  [20, 18], [28, 18], [36, 18], [44, 18], [50, 18], [60, 18], [70, 18], [80, 18], [80, 28],
  [80, 38], [80, 48], [70, 48], [60, 48], [50, 48], [48, 50], [52, 50],
].map(([x, y]) => ({ x: x!, y: y! }));

export const FINISH_PATH: Array<{ x: number; y: number }> = [
  { x: 50, y: 18 }, { x: 57, y: 25 }, { x: 50, y: 32 }, { x: 43, y: 25 }, { x: 50, y: 42 }, { x: 50, y: 50 },
];

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
  return FINISH_PATH[Math.min(token.progress - TRACK_LENGTH, FINISH_PATH.length - 1)]!;
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
