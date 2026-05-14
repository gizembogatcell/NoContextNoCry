import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

import { readFirebasePublicConfig } from "@/lib/env";

let cachedApp: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp | null {
  const config = readFirebasePublicConfig();
  if (!config?.apiKey) {
    return null;
  }

  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApps()[0]! : initializeApp(config);
  }

  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  return getAuth(app);
}
