import * as SQLite from 'expo-sqlite';
import { ColorKey } from './ludo';
import { MatchMode } from '../store/gameStore';

export interface MatchRecord {
  id: number;
  winner: ColorKey;
  mode: MatchMode;
  playerCount: number;
  finishedAt: string;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('ludoverse.db').then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS local_matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          winner TEXT NOT NULL,
          mode TEXT NOT NULL,
          player_count INTEGER NOT NULL,
          finished_at TEXT NOT NULL
        );
      `);
      return database;
    });
  }
  return databasePromise;
};

export const recordLocalMatch = async (match: Omit<MatchRecord, 'id'>) => {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO local_matches (winner, mode, player_count, finished_at) VALUES (?, ?, ?, ?)',
    match.winner,
    match.mode,
    match.playerCount,
    match.finishedAt,
  );
};

export const getRecentMatches = async (limit = 20): Promise<MatchRecord[]> => {
  const database = await getDatabase();
  return database.getAllAsync<MatchRecord>(
    'SELECT id, winner, mode, player_count AS playerCount, finished_at AS finishedAt FROM local_matches ORDER BY id DESC LIMIT ?',
    Math.max(1, Math.min(100, Math.floor(limit))),
  );
};
