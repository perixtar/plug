import { initializeApp, getApps, cert } from 'firebase-admin/app'

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
}

export function initFirebaseAdminSDK() {
  if (getApps().length <= 0) {
    return initializeApp(firebaseAdminConfig)
  }
}
