import {
  ColorKey,
  GameState,
  createGameState,
  getLegalTokens,
  hasPlayerWon,
  moveToken,
  rollForCurrentPlayer,
} from '../../src/lib/ludo.js';

export interface OnlineSeat {
  uid: string;
  displayName: string;
  seat: number;
}

export interface OnlineMatchRecord {
  roomCode: string;
  hostUid: string;
  playerUids: string[];
  winnerUid: string;
  winnerColor: ColorKey;
  players: Array<{ uid: string; displayName: string; seat: number; color: ColorKey }>;
  rulesVersion: 1;
  status: 'completed';
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

export const buildOnlineMatchRecord = (
  roomCode: string,
  hostUid: string,
  seats: OnlineSeat[],
  state: GameState,
): OnlineMatchRecord => {
  if (!state.winner) throw new Error('A winner is required to save an online match.');
  const winningPlayer = state.players.find((player) => player.id === state.winner);
  if (state.phase !== 'complete' || !winningPlayer || !hasPlayerWon(winningPlayer)) {
    throw new Error('The winning player has not completed all tokens.');
  }
  const ordered = [...seats].sort((left, right) => left.seat - right.seat);
  if (ordered.length < 2 || ordered.length > 4 || ordered.some((seat, index) => seat.seat !== index)) {
    throw new Error('Online match seats must be contiguous and contain two to four players.');
  }
  const winnerSeat = state.players.findIndex((player) => player.id === state.winner);
  const winner = ordered[winnerSeat];
  if (!winner) throw new Error('The winning seat is not part of this room.');
  return {
    roomCode,
    hostUid,
    playerUids: ordered.map((seat) => seat.uid),
    winnerUid: winner.uid,
    winnerColor: state.winner,
    players: ordered.map((seat) => ({
      uid: seat.uid,
      displayName: seat.displayName,
      seat: seat.seat,
      color: state.players[seat.seat]!.id,
    })),
    rulesVersion: 1,
    status: 'completed',
  };
};

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
