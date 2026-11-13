import { PLAYER_META, SAFE_SQUARES, TRACK_LENGTH, getLegalTokens, moveToken } from './ludo.ts';
import type { GameState } from './ludo.ts';

export type BotDifficulty = 'Easy' | 'Medium' | 'Hard';

const getTrackSquare = (color: GameState['players'][number]['id'], progress: number) =>
  (PLAYER_META[color].entry + progress) % TRACK_LENGTH;

const scoreMove = (state: GameState, tokenId: string, difficulty: Exclude<BotDifficulty, 'Easy'>) => {
  const player = state.players[state.turnIndex]!;
  const token = player.tokens.find((candidate) => candidate.id === tokenId)!;
  const next = moveToken(state, tokenId);
  const movedToken = next.players[state.turnIndex]!.tokens.find((candidate) => candidate.id === tokenId)!;
  if (next.winner) return 10_000;

  let score = movedToken.progress - token.progress;
  if (token.state === 'home') score += difficulty === 'Hard' ? 55 : 35;
  if (movedToken.state === 'finish') score += difficulty === 'Hard' ? 500 : 300;
  if (next.lastCapture) score += difficulty === 'Hard' ? 220 : 140;

  if (movedToken.state === 'track' && movedToken.progress < TRACK_LENGTH) {
    const square = getTrackSquare(movedToken.color, movedToken.progress);
    if (SAFE_SQUARES.has(square)) score += difficulty === 'Hard' ? 100 : 65;

    if (difficulty === 'Hard' && !SAFE_SQUARES.has(square)) {
      const threatened = next.players
        .filter((opponent) => opponent.id !== player.id)
        .some((opponent) => opponent.tokens.some((opponentToken) => {
          if (opponentToken.state !== 'track' || opponentToken.progress >= TRACK_LENGTH) return false;
          const distance = (square - getTrackSquare(opponentToken.color, opponentToken.progress) + TRACK_LENGTH) % TRACK_LENGTH;
          return distance >= 1 && distance <= 6;
        }));
      if (threatened) score -= 35;
    }
  }
  return score;
};

export const chooseBotMove = (
  state: GameState,
  difficulty: BotDifficulty = 'Medium',
  random: () => number = Math.random,
): string | null => {
  if (state.phase !== 'moving' || state.dice === null) return null;
  const legal = getLegalTokens(state.players[state.turnIndex]!, state.dice);
  if (legal.length === 0) return null;
  if (difficulty === 'Easy') return legal[Math.floor(random() * legal.length)]!.id;

  const scored = legal.map((token) => ({ token, score: scoreMove(state, token.id, difficulty) }));
  const bestScore = Math.max(...scored.map((candidate) => candidate.score));
  const best = scored.filter((candidate) => candidate.score === bestScore);
  return best[Math.min(best.length - 1, Math.floor(random() * best.length))]!.token.id;
};
