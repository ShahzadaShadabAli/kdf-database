import { createHmac, createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

// CNIC and phone numbers are the two pieces of directly identifying data in
// a case record, so they are encrypted before they ever reach Firestore and
// decrypted on the way back out. Anyone who gets a copy of the database —
// a leaked backup, a stolen service-account key, a Google employee — sees
// ciphertext for both fields and nothing else.
//
// Everything here runs server-side only. The key never reaches the browser.

const PREFIX = "enc.v1.";
const IV_BYTES = 12; // AES-GCM standard nonce length
const TAG_BYTES = 16;

// One secret in the environment, split into two independent subkeys so the
// encryption key and the lookup key can never be confused for each other.
function keys() {
  if (globalThis._dataKeys) return globalThis._dataKeys;

  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "Missing DATA_ENCRYPTION_KEY environment variable. CNIC and phone numbers " +
        "cannot be stored without it. See .env.local.example."
    );
  }

  const master = Buffer.from(raw, "base64");
  if (master.length !== 32) {
    throw new Error(
      `DATA_ENCRYPTION_KEY must be 32 bytes of base64 (got ${master.length}). ` +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    );
  }

  globalThis._dataKeys = {
    cipher: Buffer.from(hkdfSync("sha256", master, "", "kdf-field-encryption-v1", 32)),
    index: Buffer.from(hkdfSync("sha256", master, "", "kdf-cnic-index-v1", 32)),
  };
  return globalThis._dataKeys;
}

// AES-256-GCM with a fresh random nonce every time, so the same CNIC written
// twice produces two different ciphertexts. The auth tag means a tampered
// value fails to decrypt rather than returning something wrong.
export function encryptField(value) {
  if (value === undefined || value === null || value === "") return value;
  if (typeof value !== "string") return value;
  if (value.startsWith(PREFIX)) return value; // already encrypted

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", keys().cipher, iv);
  const ct = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

// Values written before encryption was switched on are returned untouched,
// so an older database keeps reading correctly instead of showing garbage.
export function decryptField(value) {
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return value;

  const buf = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ct = buf.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv("aes-256-gcm", keys().cipher, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// Encryption is randomised, so a ciphertext can't be looked up. This keyed
// hash gives each CNIC one stable, meaningless document ID instead — which
// is what still guarantees one case per CNIC.
//
// It has to be a *keyed* hash: there are only so many valid CNICs, so a
// plain SHA-256 could be reversed by simply hashing every possible number.
// Without the key, these are not reversible.
export function caseKey(cnic) {
  return createHmac("sha256", keys().index).update(String(cnic)).digest("hex");
}
