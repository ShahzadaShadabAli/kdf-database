import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firestore's settings() may only be called once per process, and Next.js
// dev mode re-evaluates modules on hot reload — so the instance is cached
// on globalThis rather than in module scope.
export function getDb() {
  if (globalThis._firestore) return globalThis._firestore;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIRESTORE_EMULATOR_HOST } =
    process.env;

  if (!FIREBASE_PROJECT_ID) {
    throw new Error("Missing FIREBASE_PROJECT_ID environment variable");
  }

  let app = getApps()[0];
  if (!app) {
    if (FIRESTORE_EMULATOR_HOST) {
      // The local emulator accepts unauthenticated connections.
      app = initializeApp({ projectId: FIREBASE_PROJECT_ID });
    } else {
      if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY environment variable");
      }
      app = initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          // Hosting dashboards often store the key's newlines as literal "\n".
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }
  }

  const db = getFirestore(app);
  // Optional fields are written as `field || undefined` throughout; this
  // drops them instead of Firestore rejecting the whole write.
  db.settings({ ignoreUndefinedProperties: true });
  globalThis._firestore = db;
  return db;
}
