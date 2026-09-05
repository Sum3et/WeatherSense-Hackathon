/**
 * WeatherSense — Firebase Web SDK Configuration
 * Initialises Firebase app, Auth, Firestore, and Storage.
 *
 * All VITE_ prefixed env vars are safe for frontend use;
 * they are scoped by Firebase Security Rules.
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ── Firebase config from environment variables ──
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isConfigured = Object.values(firebaseConfig).every(v => v && v !== 'undefined');

let app, auth, db;
const storage = null; // Storage disabled for Firebase Spark (free) plan

if (isConfigured) {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
} else {
  console.warn('Firebase not configured — set VITE_FIREBASE_* env vars. Running in limited mode.');
}

export { auth, db, storage, isConfigured };

// ── Collection references ───────────────────────
export const COLLECTIONS = {
  REPORTS:      'weather_reports',
  OBSERVATIONS: 'weather_observations',
  SOCIAL:       'social_reports',
};

// ── Auth helpers ────────────────────────────────
export const adminSignIn = (email, password) => {
  if (!auth) throw new Error('Firebase Auth is not configured. Please set VITE_FIREBASE_* in your .env file.');
  return signInWithEmailAndPassword(auth, email, password);
};

export const adminSignOut = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};

export const onAuthChange = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// ── Firestore real-time listeners ───────────────

/**
 * Listen to all reports with optional status filter.
 * @param {string|null} status - Filter by status, or null for all
 * @param {Function} callback - Called with array of report objects
 * @param {number} limitCount - Max reports to return
 * @returns {Function} Unsubscribe function
 */
export function listenToReports(status = 'VERIFIED', callback, limitCount = 50) {
  if (!db) {
    callback([]);
    return () => {};
  }

  const col = collection(db, COLLECTIONS.REPORTS);
  let q;

  if (status) {
    q = query(
      col,
      where('status', '==', status),
      orderBy('created_at', 'desc'),
      limit(limitCount),
    );
  } else {
    q = query(col, orderBy('created_at', 'desc'), limit(limitCount));
  }

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  }, (err) => {
    console.error('Firestore listen error:', err);
    callback([]);
  });
}

/**
 * Listen to a single report document.
 */
export function listenToReport(reportId, callback) {
  if (!db) { callback(null); return () => {}; }
  const docRef = doc(db, COLLECTIONS.REPORTS, reportId);
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/**
 * Listen to verified public reports only.
 */
export function listenToVerifiedReports(callback, limitCount = 30) {
  return listenToReports('VERIFIED', callback, limitCount);
}

// ── Firestore read helpers ──────────────────────

export async function getReports(status = 'VERIFIED', limitCount = 50) {

  if (!db) return [];
  const col = collection(db, COLLECTIONS.REPORTS);
  let q;
  if (status) {
    q = query(col, where('status', '==', status), orderBy('created_at', 'desc'), limit(limitCount));
  } else {
    q = query(col, orderBy('created_at', 'desc'), limit(limitCount));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getReport(reportId) {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.REPORTS, reportId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Storage upload (Disabled on Free Plan) ──────
export function uploadFile(file, path, onProgress = () => {}) {
  // Graceful no-op on free tier without storage
  return Promise.resolve(null);
}

// Re-export Firestore utilities
export {
  collection, doc, onSnapshot, query, where, orderBy,
  limit, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp,
};
