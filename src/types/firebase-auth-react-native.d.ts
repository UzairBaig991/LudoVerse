import type { Persistence } from 'firebase/auth';
import type AsyncStorage from '@react-native-async-storage/async-storage';

declare module 'firebase/auth' {
  // Firebase exposes this from its React Native runtime entry, while the package's
  // shared TypeScript declarations omit the platform-specific export.
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
