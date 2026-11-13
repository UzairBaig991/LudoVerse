import {
  ColorKey,
  GameState,
  PLAYER_ORDER,
  createGameState,
  getLegalTokens,
  moveToken,
  rollForCurrentPlayer,
} from '../../src/lib/ludo.js';

export interface OnlineSeat {
  uid: string;
  displayName: string;
  seat: number;
}

export const initializeOnlineGame = (seats: OnlineSeat[]): GameState => {
  const ordered = [...seats].sort((left, right) => left.seat - right.seat);
  if (ordered.length < 2 || ordered.length > 4 || ordered.some((seat, index) => seat.seat !== index)) {
    throw new Error('Online game seats must be contiguous and contain two to four players.');
  }
  const game = createGameState(ordered.length);
  return {
    ...game,
    players: game.players.map((player, index) => ({ ...player, name: ordered[index]!.displayName })),
  };
};

export const getOnlineTurnUid = (state: GameState, seats: OnlineSeat[]) =>
  seats.find((seat) => seat.seat === state.turnIndex)?.uid ?? null;

export const getOnlineTurnColor = (state: GameState): ColorKey | null =>
  state.players[state.turnIndex]?.id ?? null;

export const applyOnlineRoll = (state: GameState, die: number): GameState | null => {
  if (state.phase !== 'rolling' || !Number.isInteger(die) || die < 1 || die > 6) return null;
  return rollForCurrentPlayer(state, () => (die - 1) / 6);
};

export const applyOnlineMove = (state: GameState, tokenId: string): GameState | null => {
  if (state.phase !== 'moving' || state.dice === null || !state.players[state.turnIndex]) return null;
  const legal = getLegalTokens(state.players[state.turnIndex]!, state.dice);
  if (!legal.some((token) => token.id === tokenId)) return null;
  return moveToken(state, tokenId);
};
