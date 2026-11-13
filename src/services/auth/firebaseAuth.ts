import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestore, isFirebaseConfigured } from '../firebase/client';

export class FirebaseSetupError extends Error {
  constructor() {
    super('Firebase is not configured. Add the project values to your local .env file first.');
    this.name = 'FirebaseSetupError';
  }
}

const requireFirebaseServices = () => {
  if (!isFirebaseConfigured || !firebaseAuth || !firestore) throw new FirebaseSetupError();
  return { auth: firebaseAuth, database: firestore };
};

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  const { auth, database } = requireFirebaseServices();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const safeDisplayName = displayName.trim() || email.split('@')[0] || 'LudoVerse player';
  await updateProfile(credential.user, { displayName: safeDisplayName });
  try {
    await setDoc(doc(database, 'users', credential.user.uid), {
      uid: credential.user.uid,
      displayName: safeDisplayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Auth is still valid if Firestore rules have not been deployed yet.
    console.warn('Account created, but the profile document could not be saved:', error);
  }
  return credential;
};

export const loginWithEmail = (email: string, password: string) => {
  const { auth } = requireFirebaseServices();
  return signInWithEmailAndPassword(auth, email.trim(), password);
};

export const sendPasswordReset = (email: string) => {
  const { auth } = requireFirebaseServices();
  return sendPasswordResetEmail(auth, email.trim());
};

export const signInAsFirebaseGuest = (): Promise<UserCredential> => {
  const { auth } = requireFirebaseServices();
  return signInAnonymously(auth);
};

export const signOutFromFirebase = async () => {
  const { auth } = requireFirebaseServices();
  await signOut(auth);
};

export const getReadableAuthError = (error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';
  const messages: Record<string, string> = {
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account already uses this email.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'auth/operation-not-allowed': 'Enable this sign-in method in Firebase Authentication settings.',
    'auth/user-disabled': 'This account is disabled. Contact support.',
  };
  if (error instanceof FirebaseSetupError) return error.message;
  return messages[code] ?? 'Authentication failed. Please try again.';
};
