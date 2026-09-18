import { getDb } from "@/lib/firebase";
import { caseKey, decryptField, encryptField } from "@/lib/crypto";

export class DbError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Firestore hands dates back as Timestamp objects; everything downstream
// (pages, client components, the Excel export) expects plain JS Dates.
function toPlain(value) {
  if (value instanceof Date) return value;
  if (value && typeof value.toDate === "function") return value.toDate();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

const cases = () => getDb().collection("cases");
const users = () => getDb().collection("users");

// ---- cases ----
// Documents are keyed by a keyed hash of the CNIC: Firestore has no unique
// indexes, so the document ID is what guarantees one case per CNIC — and
// hashing it keeps the number itself out of the document name.
//
// These two fields identify a person directly, so they are the ones that
// get encrypted. Encrypting and decrypting happens here and nowhere else:
// every caller hands in and receives ordinary plaintext.
const ENCRYPTED_FIELDS = ["cnic", "phone"];

function encryptCase(data) {
  const out = { ...data };
  for (const field of ENCRYPTED_FIELDS) {
    if (out[field] !== undefined) out[field] = encryptField(out[field]);
  }
  return out;
}

function decryptCase(data) {
  const out = toPlain(data);
  for (const field of ENCRYPTED_FIELDS) {
    if (out[field] !== undefined) out[field] = decryptField(out[field]);
  }
  return out;
}

export async function getCase(cnic) {
  const snap = await cases().doc(caseKey(cnic)).get();
  return snap.exists ? decryptCase(snap.data()) : null;
}

export async function listCases() {
  const snap = await cases().get();
  return snap.docs.map((d) => decryptCase(d.data())).sort((a, b) => b.submittedAt - a.submittedAt);
}

// Reserves the next KDF-###### number and creates the case in one
// transaction, so a rejected duplicate never burns a case number and two
// simultaneous submissions can never get the same one.
export async function createCase(caseData) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const counterRef = db.collection("counters").doc("caseNo");
    const counterSnap = await tx.get(counterRef);
    const caseRef = cases().doc(caseKey(caseData.cnic));
    const existing = await tx.get(caseRef);

    if (existing.exists) {
      throw new DbError(
        409,
        existing.data().status === "withdrawn"
          ? "This CNIC was withdrawn — restore it from the case list instead of submitting a new one."
          : "A case with this CNIC already exists."
      );
    }

    const seq = (counterSnap.exists ? counterSnap.data().seq : 0) + 1;
    const caseNo = "KDF-" + String(seq).padStart(6, "0");
    tx.set(counterRef, { seq });
    tx.create(caseRef, encryptCase({ ...caseData, caseNo }));
    return { caseNo, cnic: caseData.cnic };
  });
}

// Reads the case, lets `mutate` validate and return its next state, then
// writes it back — all in one transaction. If the CNIC changed, the
// document is re-keyed under the new CNIC.
export async function updateCase(cnic, mutate) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const ref = cases().doc(caseKey(cnic));
    const snap = await tx.get(ref);
    if (!snap.exists) throw new DbError(404, "No case found for this CNIC");

    const next = mutate(decryptCase(snap.data()));

    if (next.cnic === cnic) {
      tx.set(ref, encryptCase(next));
      return next;
    }

    const newRef = cases().doc(caseKey(next.cnic));
    const dup = await tx.get(newRef);
    if (dup.exists) {
      throw new DbError(
        409,
        dup.data().status === "withdrawn"
          ? "That CNIC belongs to a withdrawn case — restore it instead of reassigning it here."
          : "A case with this CNIC already exists."
      );
    }
    tx.create(newRef, encryptCase(next));
    tx.delete(ref);
    return next;
  });
}

// Permanently removes a case once `check` (which throws to refuse) approves
// it. A short note — case number, who and when, but no personal details — is
// kept in `deletions`, so a missing case number can still be accounted for.
export async function deleteCase(cnic, check, deletedBy) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const ref = cases().doc(caseKey(cnic));
    const snap = await tx.get(ref);
    if (!snap.exists) throw new DbError(404, "No case found for this CNIC");
    const found = decryptCase(snap.data());
    check(found);
    tx.delete(ref);
    tx.create(db.collection("deletions").doc(), {
      caseNo: found.caseNo,
      caseType: found.caseType || "new",
      status: found.status,
      deletedBy,
      deletedAt: new Date(),
    });
    return found;
  });
}

// ---- users ----
// Documents are keyed by username, for the same uniqueness reason.

export async function getUser(username) {
  const snap = await users().doc(username).get();
  return snap.exists ? toPlain(snap.data()) : null;
}

export async function listUsers() {
  const snap = await users().get();
  return snap.docs
    .map((d) => {
      const { passwordHash, ...safe } = toPlain(d.data());
      return safe;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

const ALREADY_EXISTS = 6;

export async function createUser(user) {
  try {
    await users().doc(user.username).create(user);
  } catch (err) {
    if (err.code === ALREADY_EXISTS) throw new DbError(409, "That username is already taken.");
    throw err;
  }
}

export async function setUserPassword(username, passwordHash) {
  await users().doc(username).update({ passwordHash });
}
