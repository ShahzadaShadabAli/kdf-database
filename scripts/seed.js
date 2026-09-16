// Creates the one bootstrap admin account, if it doesn't already exist.
// Run with: npm run seed
//
// Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_DISPLAY_NAME in .env.local
// before running this. Whoever sets those values is the only person who
// ever sees that password — it's read from the environment, never
// hardcoded in this file. Every other account (KDF and Social Welfare
// staff, and any further admins) should be created afterward from the admin's
// "+ New User" screen inside the app itself, not by editing this script.
require("dotenv").config({ path: ".env.local" });

const bcrypt = require("bcryptjs");
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIRESTORE_EMULATOR_HOST,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  ADMIN_DISPLAY_NAME,
} = process.env;

if (!FIREBASE_PROJECT_ID || (!FIRESTORE_EMULATOR_HOST && (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY))) {
  console.error(
    "Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and\n" +
      "FIREBASE_PRIVATE_KEY in .env.local before running the seed script."
  );
  process.exit(1);
}

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_DISPLAY_NAME) {
  console.error(
    "Missing ADMIN_USERNAME, ADMIN_PASSWORD, and/or ADMIN_DISPLAY_NAME.\n" +
      "Set these in .env.local before running the seed script — this creates\n" +
      'the one bootstrap admin account. Every other account should be\n' +
      'created afterward from the admin\'s "+ New User" screen in the app.'
  );
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const app = FIRESTORE_EMULATOR_HOST
  ? initializeApp({ projectId: FIREBASE_PROJECT_ID })
  : initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });

async function main() {
  const db = getFirestore(app);
  const username = ADMIN_USERNAME.toLowerCase().trim();
  const ref = db.collection("users").doc(username);

  if ((await ref.get()).exists) {
    console.log(`User "${username}" already exists — nothing to do.`);
  } else {
    await ref.create({
      username,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
      displayName: ADMIN_DISPLAY_NAME,
      createdAt: new Date(),
    });
    console.log(`Created admin account "${username}".`);
  }

  console.log('Sign in and use the admin\'s "+ New User" screen to create KDF and Social Welfare accounts.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
