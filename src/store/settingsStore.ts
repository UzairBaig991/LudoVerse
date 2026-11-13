import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsState>()(persist(
  (set) => ({
    soundEnabled: true,
    setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  }),
  {
    name: 'ludoverse-settings',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({ soundEnabled: state.soundEnabled }),
  },
));
