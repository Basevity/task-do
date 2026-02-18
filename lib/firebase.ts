import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  type User,
  type Unsubscribe,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getApp(): FirebaseApp | null {
  if (getApps().length === 0) {
    if (!firebaseConfig.projectId) return null;
    return initializeApp(firebaseConfig);
  }
  return getApps()[0] as FirebaseApp;
}

export const app = typeof window !== "undefined" ? getApp() : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export function isFirebaseReady(): boolean {
  return !!db;
}

export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth not ready");
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth not ready");
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  return user;
}

export function signOut(): Promise<void> {
  if (!auth) return Promise.resolve();
  return firebaseSignOut(auth);
}

export function subscribeAuth(cb: (user: User | null) => void): Unsubscribe | undefined {
  if (!auth) return cb(null), undefined;
  return onAuthStateChanged(auth, cb);
}

export async function changeUserPassword(newPassword: string): Promise<void> {
  if (!auth?.currentUser) throw new Error("Not signed in");
  await updatePassword(auth.currentUser, newPassword);
}

export async function changeUserDisplayName(displayName: string): Promise<void> {
  if (!auth?.currentUser) throw new Error("Not signed in");
  await updateProfile(auth.currentUser, { displayName });
}
