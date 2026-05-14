import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

import { getServerEnv } from "@/lib/env";

let cachedApp: App | null = null;

function initAdminApp(): App {
  if (cachedApp) {
    return cachedApp;
  }
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return cachedApp;
  }

  const env = getServerEnv();
  const hasServiceAccount =
    env.FIREBASE_ADMIN_PROJECT_ID &&
    env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    env.FIREBASE_ADMIN_PRIVATE_KEY;

  cachedApp = hasServiceAccount
    ? initializeApp({
        credential: cert({
          projectId: env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
        }),
      })
    : initializeApp({ credential: applicationDefault() });

  return cachedApp;
}

export function getAdminAuth(): Auth {
  return getAuth(initAdminApp());
}
