"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { readFirebasePublicConfig } from "@/lib/env";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  firebaseConfigured: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const firebaseConfigured = !!readFirebasePublicConfig()?.apiKey;

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      queueMicrotask(() => {
        setUser(null);
        setLoading(false);
      });
      return;
    }

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }
    await firebaseSignOut(auth);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        "Firebase is not configured. Copy .env.local.example to .env.local.",
      );
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  }, []);

  const getIdToken = useCallback(
    async (forceRefresh = false) => {
      if (!user) return null;
      return user.getIdToken(forceRefresh);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseConfigured,
      signInWithGoogle,
      signOut,
      getIdToken,
    }),
    [user, loading, firebaseConfigured, signInWithGoogle, signOut, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
