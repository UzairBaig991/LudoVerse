import { Audio } from 'expo-av';

export type SoundKey = 'roll' | 'move' | 'capture' | 'win';

const soundMap: Record<SoundKey, number> = {
  roll: require('../../assets/sounds/dice-roll.wav'),
  move: require('../../assets/sounds/token-move.wav'),
  capture: require('../../assets/sounds/token-capture.wav'),
  win: require('../../assets/sounds/victory.wav'),
};

const soundCache: Partial<Record<SoundKey, Audio.Sound>> = {};

export const playSound = async (key: SoundKey) => {
  try {
    if (!soundCache[key]) {
      const { sound } = await Audio.Sound.createAsync(soundMap[key]);
      soundCache[key] = sound;
    }

    const cache = soundCache[key];
    if (!cache) {
      return;
    }

    await cache.stopAsync();
    await cache.setPositionAsync(0);
    await cache.playAsync();
  } catch (error) {
    console.log('Audio playback failed:', error);
  }
};

export const disposeAudio = async () => {
  for (const sound of Object.values(soundCache)) {
    await sound.unloadAsync();
  }
};
