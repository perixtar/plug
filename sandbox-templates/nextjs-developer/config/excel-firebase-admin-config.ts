import { initializeApp, getApps, cert } from "firebase-admin/app";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.EXCEL_FIREBASE_PROJECT_ID!,
    clientEmail: process.env.EXCEL_FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.EXCEL_FIREBASE_ADMIN_PRIVATE_KEY!.replace(
      /\\n/g,
      "\n"
    ),
  }),
  storageBucket: process.env.EXCEL_FIREBASE_STORAGE_BUCKET!,
};

export function initExcelFirebaseAdminSDK() {
  if (getApps().length <= 0) {
    return initializeApp(firebaseAdminConfig);
  }
}
