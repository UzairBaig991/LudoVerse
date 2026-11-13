import { create } from 'zustand';

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
  roomCode: string;
  rooms: string[];
  playerCount: number;
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
  createRoom: () => void;
  joinRoom: (code: string) => void;
  resetRoom: () => void;
}

const createRoomCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
};

export const useGameStore = create<GameStore>((set) => ({
  selectedMode: 'Quick Match',
  roomCode: 'LV-2048',
  rooms: ['LV-2048', 'LV-4421'],
  playerCount: 4,
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
  createRoom: () =>
    set((state) => {
      const nextCode = createRoomCode();
      return {
        roomCode: nextCode,
        rooms: [nextCode, ...state.rooms].slice(0, 4),
      };
    }),
  joinRoom: (code) => set({ roomCode: code.trim().toUpperCase() || 'LV-2048' }),
  resetRoom: () => set({ roomCode: 'LV-2048' }),
}));
