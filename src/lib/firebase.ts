import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence,
  type Auth, type User,
} from 'firebase/auth';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, onSnapshot, writeBatch, type Firestore,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from './firebaseConfig';

export const CLOUD_ENABLED = !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let fs: Firestore | null = null;

function init() {
  if (app) return;
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  try {
    fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    fs = getFirestore(app);
  }
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

if (CLOUD_ENABLED) init();

export const FB = {
  onAuth(cb: (u: User | null) => void) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, cb);
  },
  signIn: (email: string, pass: string) => signInWithEmailAndPassword(auth!, email, pass),
  signUp: (email: string, pass: string) => createUserWithEmailAndPassword(auth!, email, pass),
  signOut: () => fbSignOut(auth!),
  reset: (email: string) => sendPasswordResetEmail(auth!, email),
  col: (...path: string[]) => collection(fs!, path[0], ...path.slice(1)),
  doc: (...path: string[]) => doc(fs!, path[0], ...path.slice(1)),
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch: () => writeBatch(fs!),
};

export type { User };
