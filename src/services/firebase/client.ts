import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  ...(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET } : {}),
  ...(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? { messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID } : {}),
};

export const isFirebaseConfigured = [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId].every(
  (value) => value.length > 0 && !value.toLowerCase().includes('replace-me'),
);

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  : null;

const initializeFirebaseAuth = (app: FirebaseApp): Auth => {
  if (Platform.OS === 'web') return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast refresh can preserve an Auth instance between module reloads.
    return getAuth(app);
  }
};

export const firebaseAuth = firebaseApp ? initializeFirebaseAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
