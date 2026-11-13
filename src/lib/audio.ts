import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type SoundKey = 'roll' | 'move' | 'capture' | 'win';

const soundMap: Record<SoundKey, number> = {
  roll: require('../../assets/sounds/dice-roll.wav'),
  move: require('../../assets/sounds/token-move.wav'),
  capture: require('../../assets/sounds/token-capture.wav'),
  win: require('../../assets/sounds/victory.wav'),
};

const soundCache: Partial<Record<SoundKey, AudioPlayer>> = {};

export const playSound = async (key: SoundKey) => {
  try {
    const player = soundCache[key] ?? createAudioPlayer(soundMap[key]);
    soundCache[key] = player;

    player.pause();
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.log('Audio playback failed:', error);
  }
};

export const disposeAudio = () => {
  for (const key of Object.keys(soundCache) as SoundKey[]) {
    soundCache[key]?.remove();
    delete soundCache[key];
  }
};
