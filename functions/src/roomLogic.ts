import { randomInt } from 'node:crypto';

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const makeRoomCode = () =>
  Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

export const isValidRoomCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-HJ-NP-Z2-9]{8}$/.test(value);

export const findOpenSeat = (players: Array<{ seat: number }>, capacity: number) => {
  const occupied = new Set(players.map((player) => player.seat));
  return Array.from({ length: capacity }, (_, seat) => seat).find((seat) => !occupied.has(seat));
};
