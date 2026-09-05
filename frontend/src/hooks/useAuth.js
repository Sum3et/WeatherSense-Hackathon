/**
 * useAuth — Firebase Authentication & Demo Admin session hook.
 */
import { useState, useEffect } from 'react';
import { onAuthChange, adminSignIn, adminSignOut, auth } from '../services/firebase';
import { setAuthToken } from '../services/api';

const SESSION_KEY = 'weathersense_admin_session';

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAuthToken(parsed.token);
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force refresh (true) to ensure custom claims like admin: true are present
          const token = await firebaseUser.getIdToken(true);
          const authUser = { uid: firebaseUser.uid, email: firebaseUser.email, token };
          setAuthToken(token);
          setUser(authUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
        } catch (err) {
          console.warn('Token acquisition error:', err);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check for Demo / Presentation Credentials
    if (
      (cleanEmail === 'admin@weathersense.in' && (password === 'admin123' || password === 'admin' || password === 'weathersense2026')) ||
      (!auth && cleanEmail.includes('admin'))
    ) {
      const demoUser = {
        uid: 'demo-admin-moes',
        email: cleanEmail || 'admin@weathersense.in',
        token: 'weathersense-demo-admin-2026',
        role: 'Administrator',
      };
      setAuthToken(demoUser.token);
      setUser(demoUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
      return demoUser;
    }

    // 2. Real Firebase Auth if configured
    try {
      const cred = await adminSignIn(email, password);
      // Force refresh token so any newly assigned custom claims are guaranteed to be in the JWT
      const token = await cred.user.getIdToken(true);
      const authUser = { uid: cred.user.uid, email: cred.user.email, token };
      setAuthToken(token);
      setUser(authUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return authUser;

    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message;
      setError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    try {
      await adminSignOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    localStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setUser(null);
  };

  // Keep session alive
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        if (auth?.currentUser) {
          const token = await auth.currentUser.getIdToken(true);
          setAuthToken(token);
        }
      } catch (err) {
        console.warn('Token refresh failed:', err);
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return { user, loading, error, signIn, signOut, isAdmin: !!user };
}
