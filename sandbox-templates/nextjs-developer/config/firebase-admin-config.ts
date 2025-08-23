// app/config/firebase-admin.ts
// Place in a *server-only* module (Node runtime; not Edge).
import "server-only";
import { App, getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { AppOptions } from "firebase-admin/app";

// optional: cache to avoid re-init in dev/hot-reload
const byName: Record<string, App> = {};

function getOrInitAdmin(name: string, options: AppOptions): App {
  if (byName[name]) return byName[name];
  const existing = getApps().find((a) => a.name === name);
  if (existing) return (byName[name] = existing);
  return (byName[name] = initializeApp(options, name));
}

/** Default/primary project */
export const defaultAdminApp = getOrInitAdmin("default-admin", {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const defaultDb = getFirestore(defaultAdminApp);
