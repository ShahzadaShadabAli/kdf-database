// Nightly backup: copies every Firestore collection into one JSON file,
// compressed and locked with a password, for the GitHub Actions workflow in
// .github/workflows/backup.yml to keep. Firestore's own scheduled backups
// need a paid plan; this does the same job for free.
//
// It only ever reads from the database. Documents are copied exactly as
// stored, so CNIC and phone numbers stay encrypted with DATA_ENCRYPTION_KEY
// inside the backup too, and the file itself is encrypted with
// BACKUP_PASSWORD on top (the repository is public, so anyone can download
// what the workflow saves).
//
// Run with: node scripts/backup.js [output-folder]
// Needs FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (or FIRESTORE_EMULATOR_HOST) and BACKUP_PASSWORD in the environment.
// Open a backup with scripts/decrypt-backup.js.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { createCipheriv, randomBytes, scryptSync } = require("crypto");
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp, GeoPoint, DocumentReference } = require("firebase-admin/firestore");

// Shared with scripts/decrypt-backup.js — change both together.
const MAGIC = Buffer.from("KDFBAK01");
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

// Values copied out of .env.local often bring its surrounding quotes and a
// stray space or newline along; a secret pasted that way still works.
const unquote = (v) => (v || "").trim().replace(/^(["'])([\s\S]*)\1$/, "$2").trim();

const FIREBASE_PROJECT_ID = unquote(process.env.FIREBASE_PROJECT_ID);
const FIREBASE_CLIENT_EMAIL = unquote(process.env.FIREBASE_CLIENT_EMAIL);
const FIREBASE_PRIVATE_KEY = unquote(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");
const { FIRESTORE_EMULATOR_HOST, BACKUP_PASSWORD } = process.env;

function fail(message) {
  console.error(message);
  // On GitHub, also show the reason on the run's summary page, so nobody has
  // to dig through the log to find it.
  if (process.env.GITHUB_ACTIONS) {
    const escaped = message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    console.log(`::error title=Backup failed::${escaped}`);
  }
  process.exit(1);
}

// Google's own error text is terse; say which secret to check. Never echoes
// a secret's value — the log of a public repository is public.
function explain(err) {
  const raw = String(err && err.message ? err.message : err).split("\n")[0].slice(0, 300);
  if (/private key|PEM|DECODER|asn1|pkcs/i.test(raw)) {
    return (
      "FIREBASE_PRIVATE_KEY isn't a valid private key. Paste the whole private_key value from the " +
      `service-account JSON, from -----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----. (${raw})`
    );
  }
  if (/invalid_grant|invalid_client|UNAUTHENTICATED|account not found|Invalid JWT/i.test(raw)) {
    return (
      "Google rejected the service-account key. Check that FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY " +
      `are the same pair Vercel uses, and that the key hasn't been deleted or disabled. (${raw})`
    );
  }
  if (/PERMISSION_DENIED/i.test(raw)) {
    return `This service account isn't allowed to read Firestore in project "${FIREBASE_PROJECT_ID}". (${raw})`;
  }
  if (/NOT_FOUND/i.test(raw)) {
    return `No Firestore database found for project "${FIREBASE_PROJECT_ID}" — check FIREBASE_PROJECT_ID. (${raw})`;
  }
  return raw;
}

if (!FIREBASE_PROJECT_ID || (!FIRESTORE_EMULATOR_HOST && (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY))) {
  fail("Missing Firebase credentials: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.");
}
if (!BACKUP_PASSWORD || BACKUP_PASSWORD.length < 12) {
  fail("Set BACKUP_PASSWORD to a password of at least 12 characters. It's needed to open the backup later.");
}

let db;
try {
  const app = FIRESTORE_EMULATOR_HOST
    ? initializeApp({ projectId: FIREBASE_PROJECT_ID })
    : initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
  db = getFirestore(app);
} catch (err) {
  fail(explain(err));
}

// JSON has no dates, so Firestore's own types are written as tagged objects
// a restore can turn back into the real thing.
function toJson(value) {
  if (value instanceof Timestamp) return { __type: "timestamp", value: value.toDate().toISOString() };
  if (value instanceof GeoPoint) return { __type: "geopoint", latitude: value.latitude, longitude: value.longitude };
  if (value instanceof DocumentReference) return { __type: "reference", path: value.path };
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { __type: "bytes", base64: Buffer.from(value).toString("base64") };
  }
  if (Array.isArray(value)) return value.map(toJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJson(v)]));
  }
  return value;
}

// Pakistan date, so a backup taken at 2:30 am is named for that day.
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

function encrypt(plain, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32, SCRYPT);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
}

async function main() {
  const outDir = process.argv[2] || "backup";
  const exportedAt = new Date().toISOString();
  const day = today();

  // Every top-level collection, so one added later is backed up too.
  const collections = {};
  const counts = {};
  for (const col of await db.listCollections()) {
    const snap = await col.get();
    collections[col.id] = Object.fromEntries(snap.docs.map((d) => [d.id, toJson(d.data())]));
    counts[col.id] = snap.size;
  }
  // An empty result means the wrong project or a broken connection, not an
  // empty register — fail loudly rather than save a backup of nothing.
  if (Object.keys(counts).length === 0) {
    fail(`No collections found in project "${FIREBASE_PROJECT_ID}". Nothing was saved.`);
  }

  const backup = {
    format: "kdf-case-register-backup",
    version: 1,
    projectId: FIREBASE_PROJECT_ID,
    exportedAt,
    counts,
    collections,
  };

  const file = path.join(outDir, `kdf-backup-${day}.json.gz.enc`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(file, encrypt(zlib.gzipSync(JSON.stringify(backup)), BACKUP_PASSWORD));

  // Counts only — the workflow log of a public repository is public.
  for (const [name, n] of Object.entries(counts)) console.log(`${name}: ${n} documents`);
  console.log(`Saved ${file} (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `file=${file}\nday=${day}\n`);
  }
}

main().catch((err) => fail(explain(err)));
