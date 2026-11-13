import { create } from 'zustand';
import { BotDifficulty } from '../lib/bot';

export type MatchMode =
  | 'Quick Match'
  | 'Private Room'
  | 'Play With Friends'
  | 'Offline Multiplayer'
  | 'Play Against Computer'
  | 'Local Pass-and-Play';

export interface LeaderboardEntry {
  name: string;
  wins: number;
  rating: string;
  accent: string;
}

interface GameStore {
  selectedMode: MatchMode;
  playerCount: number;
  botDifficulty: BotDifficulty;
  profile: {
    username: string;
    level: number;
    coins: number;
    wins: number;
    matches: number;
    winRate: number;
  };
  leaderboard: LeaderboardEntry[];
  setSelectedMode: (mode: MatchMode) => void;
  setPlayerCount: (count: number) => void;
  setBotDifficulty: (difficulty: BotDifficulty) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedMode: 'Quick Match',
  playerCount: 4,
  botDifficulty: 'Medium',
  profile: {
    username: 'Astra Knight',
    level: 34,
    coins: 12480,
    wins: 248,
    matches: 512,
    winRate: 48,
  },
  leaderboard: [
    { name: 'Astra', wins: 248, rating: '#1', accent: '#FFD700' },
    { name: 'Nova', wins: 214, rating: '#2', accent: '#F44336' },
    { name: 'Echo', wins: 198, rating: '#3', accent: '#4CAF50' },
    { name: 'Milo', wins: 176, rating: '#4', accent: '#2196F3' },
  ],
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setPlayerCount: (count) => set({ playerCount: count }),
  setBotDifficulty: (botDifficulty) => set({ botDifficulty }),
}));
