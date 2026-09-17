# Case Register

A case-tracking app for the Karakoram Disability Forum (KDF). KDF registers
a disabled applicant once; a Social Welfare Department (SWD) reviewer looks
the case over and prints a referral certificate for them to carry, in
person, to a DHQ Hospital Medical/Disability Assessment Board. The board's
exam and certificate stay entirely on paper — this app tracks the case
before and after that visit, not during it.

- **KDF** registers a new case and manages it while it's still awaiting a
  decision — editing details, withdrawing a mistaken entry, restoring one.
- **Social Welfare (SWD)** reviews referred cases, prints the paper referral
  certificate, and later records Verified or Rejected once the applicant
  returns with their DHQ medical certificate in hand.
- **Admin** creates every account (KDF, SWD, further admins) — the only
  role with no case access at all.

## Tech stack

Next.js (App Router, JavaScript), Firebase Cloud Firestore via the
`firebase-admin` SDK (server-side only — the browser never talks to the
database directly), NextAuth.js (Credentials provider, JWT sessions), zod
for server-side validation.

### How data is stored

- `cases/{hashed cnic}` — one document per applicant. Firestore has no
  unique indexes, so the document ID itself is what guarantees one case per
  CNIC; the ID is a keyed hash of the CNIC rather than the number itself, so
  the database never holds a readable CNIC even as a document name. Editing
  a case's CNIC re-keys the document inside a transaction.
- `users/{username}` — one document per account, keyed by username for the
  same reason. Holds the bcrypt password hash, role, and display name.
- `counters/caseNo` — the running sequence behind `KDF-000123` case
  numbers, incremented in the same transaction that creates the case.

Every read happens server-side and needs no composite indexes, so there's
no index configuration to set up in the Firebase console.

### Encryption of CNIC and phone numbers

A case record names a disabled person and ties them to an address, so the
two directly identifying fields — **CNIC** and **phone number** — are
encrypted before they are written to Firestore and decrypted on the way
back out. Anyone holding a copy of the database — a leaked backup, a stolen
service-account key, Google itself — sees ciphertext for both.

- **Fields** are encrypted with AES-256-GCM using a fresh random nonce, so
  the same CNIC written twice produces two different ciphertexts and the
  database reveals nothing by comparing them. The authentication tag means a
  tampered value fails to decrypt instead of quietly returning something
  wrong.
- **Document IDs** are an HMAC-SHA256 of the CNIC. Randomised ciphertext
  can't be looked up, so this gives each CNIC one stable, meaningless ID to
  store the case under — which is what still enforces one case per CNIC. The
  hash is *keyed*: there are only so many valid CNICs, so a plain SHA-256
  could be reversed by simply hashing every possible number.
- Both keys are derived (HKDF-SHA256) from the single `DATA_ENCRYPTION_KEY`
  secret, so there is one value to configure and back up.

All of this lives in `lib/crypto.js` and is applied in `lib/db.js` and
nowhere else: every page, API route, filter and Excel export hands in and
receives ordinary plaintext, and never sees a ciphertext. Values written
before encryption was switched on are passed through unchanged, so an older
database keeps reading correctly.

> **Back up `DATA_ENCRYPTION_KEY`, separately from the database.** It is not
> recoverable. Without it, every stored CNIC and phone number is unreadable
> and no existing case can be looked up again. Local development and the
> deployed server must use the same value, or neither can read the other's
> records. Rotating it requires decrypting and rewriting every case with the
> old key still in hand.

One deliberate substitution: **bcryptjs** instead of `bcrypt`. Both use the
same algorithm and hash format; `bcryptjs` is pure JavaScript, which avoids
native-module build tooling on machines (including Windows) that don't have
a C++ toolchain installed.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in:

   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` —
     from a Firebase service-account key (Firebase Console → Project
     settings → Service accounts → Generate new private key).
   - `NEXTAUTH_SECRET` — a long random string (`openssl rand -base64 32`).
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev.
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` — the one
     bootstrap admin account (see "Accounts & roles" below).

   `.env.local` is git-ignored — never commit real credentials.

3. Create the bootstrap admin account:

   ```bash
   npm run seed
   ```

   This creates a single admin account from the `ADMIN_*` values in
   `.env.local`. It does **not** print a password anywhere — whoever fills
   in `.env.local` already knows it, because they chose it.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` — it redirects to `/login`. Sign in with
   the admin account, then use its **+ New User** screen (`/admin/new`) to
   create the real KDF and SWD accounts.

## Accounts & roles

There's no self-registration. The **only** account created outside the app
is the bootstrap admin, via `npm run seed` reading `ADMIN_*` from
`.env.local` — every other account is created from `/admin/new` by someone
who is already an admin, with a temporary password they choose and hand to
that person directly. Anyone can change their own password afterward from
the **Change password** link in the top bar (`/account`) — the old password
has to be entered correctly first.

## Case types

KDF's intake form (`/kdf/new`) offers two case types, switchable from the
top-right of the form (new is the default):

- **New case** — a disabled applicant registering for the first time. Goes
  through the full referred → Social Welfare decision flow described below.
- **Old case** — a pre-existing paper record (from before this system
  existed) being typed in for the record. It has its own, shorter field set
  (name, S/O or D/O + father's/husband's name, type/nature of disability,
  fit/unfit, date of birth, CNIC, a single free-text address, contact
  number, and the original paper certificate number) and is saved as
  `status: "verified"` immediately — it never enters Social Welfare's
  referred queue, since it's already a settled historical record, not a new
  referral. Because it skips "referred," it also can't be edited afterward
  (same rule as any other verified case) and doesn't get the printable
  application form or disability certificate, since those are built from
  new-case fields it doesn't have.

## How a case flows

1. **KDF** registers a new case at `/kdf/new` when a disabled applicant
   comes in. A case number (`KDF-000123`, atomically incremented) is
   assigned and the case starts as `status: "referred"`. KDF's own case
   list (`/kdf`) is split into two tables: **Referred** (still awaiting
   Social Welfare) and **Completed** (verified, rejected, or withdrawn).
2. While a case is still **referred**, KDF can edit it (`/kdf/[cnic]`,
   including fixing a CNIC typo) or withdraw it — a soft-delete that pulls
   it out of Social Welfare's queue entirely (their list, their API, and a
   direct link to it all behave as if the case doesn't exist) without ever
   deleting the record or its audit history. A withdrawn case shows up only
   in KDF's own Completed table, with a **Restore** button that sets it back
   to Referred. Once Social Welfare records a decision, KDF can no longer
   edit, withdraw, or restore that case.
3. **Social Welfare** sees the same two-table split at `/swd`. Opening a
   referred case shows the full applicant record and a **Print referral
   certificate** link — a formatted, printable page (`/swd/[cnic]/certificate`)
   the applicant carries to the DHQ board in person. Nothing about the DHQ
   exam or the physical certificate it produces is recorded in this app.
4. When the applicant returns with their DHQ medical certificate, Social
   Welfare opens the case and clicks **Verify** or **Reject** — a one-way
   decision that moves the case out of Referred and into their own
   Completed table too.

Every submit/edit/withdraw/restore/verify/reject action appends an entry to
the case's `auditLog` (`action`, `byUser`, `at`) — actions are `submitted`,
`updated`, `withdrawn`, `restored`, `verified`, `rejected`. The API never
edits or deletes existing entries, so "who did what and when" is always
answerable.

## Case fields

**New case:** Name, gender, marital status, son/daughter of, spouse
(optional), date of birth, CNIC, qualification (optional), phone, email
(optional), assistive devices provided (optional), type of disability
(Physically / Visually / Hearing and Speech / Mentally Retarded / Multiple
Disabilities), source of income (optional), and two addresses — present
and permanent, each broken into UC / Tehsil / District rather than one
free-text field, with a "same as present" option.

These match the government's own paper form — Application for Disability
Certificate/Supportive Aid (Social Welfare Department Gilgit-Baltistan,
NCRDP, SSMC RHQ Hospital Skardu) — so that Social Welfare's printable
application form (`/swd/[cnic]/certificate`) is a faithful reproduction of
that exact form, filled in from the case record.

The form's own note — *"Please filled S. No. 9,10,11, 17,18,19,20 and 21"* —
marks the entries that belong to Social Welfare, not intake, so KDF's form
doesn't ask for them (and the API drops them if sent):

| S. No. | Entry | Stored as |
|---|---|---|
| 9 | Nature of disability | `natureOfDisability` |
| 10 | Cause of disability | `causeOfDisability` |
| 11 | Type of job can do | `jobType` |
| 17 | Disabled / Not Disabled | `disabledStatus` |
| 18 | Disability / Impairment | `impairment` |
| 19–20 | Fit / not fit for work (one ✓) | `fitness` (`Fit` / `Unfit`) |
| 21 | Category A / B / C (one ✓) | `category` |

Pressing **Print** on the application form opens a *Before printing* pop-up
asking for these, prefilled with whatever was saved last time. **Save and
print** stores them on the case and then prints. Any of them may be left
blank to be written in by hand — except that a verified case can't lose its
nature of disability or fit/unfit status, since the register, the Excel
export and the disability certificate depend on them. Social Welfare also
enters 9–11, fit/unfit and the category when verifying a case; both places
write the same fields, and a KDF edit never overwrites them. Choosing a
category at verification reveals an optional **Remarks** box
(`categoryRemarks`), shown on the case page; it's cleared if the category
later is. Source of income (12) is KDF's alone — verification doesn't
touch it.

Field 8's four printed boxes (Physically / Visually / Hearing / Mentally)
are ticked by clicking them on the form, and **more than one** can be
ticked. Until the form is first saved, the box matching KDF's recorded
type is pre-ticked ("Hearing and Speech" → Hearing, "Mentally Retarded" →
Mentally; "Multiple Disabilities" starts with none). The ticks are saved
along with the pop-up (`disabilityChecks`). Signature lines print blank.

The disability-type options were renamed from an earlier version of this
form ("Hearing" → "Hearing and Speech", "Mentally" → "Mentally Retarded",
plus a new "Multiple Disabilities" option) — the old labels are still
accepted so pre-existing cases saved under them stay editable; the intake
form itself only offers the current five.

**Old case:** Name, S/O or D/O + father's/husband's name, type/nature of
disability (free text), fit/unfit, date of birth, CNIC, a single free-text
address, contact number, and the original paper certificate number. See
"Case types" above.

## Searching and filtering

Both `/kdf` and `/swd` case tables have a filter bar above them — gender,
a free-text disability search (matches type or nature of disability),
an age range (computed from date of birth), and free-text UC/tehsil/district
matches. Filtering happens client-side against the already-loaded case
list, so it updates instantly with no page reload. Old-case records don't
have gender or a structured address, so a filter on those fields simply
won't match them unless left blank.

## Pages & API

**Pages**

| Route | Role | Purpose |
|---|---|---|
| `/login` | any | Single sign-in, redirects by role |
| `/kdf` | kdf | Referred + Completed tables |
| `/kdf/new` | kdf | Register a new case |
| `/kdf/[cnic]` | kdf | Edit — only while referred |
| `/swd` | swd | Referred + Completed tables |
| `/swd/[cnic]` | swd | Full case detail, decision buttons |
| `/swd/[cnic]/certificate` | swd | Printable referral certificate |
| `/admin` | admin | Account list |
| `/admin/new` | admin | Create an account |
| `/account` | any | Change your own password |

**API**

| Endpoint | Who | Does |
|---|---|---|
| `POST /api/cases` | kdf | Create — rejects a CNIC already referred/decided |
| `GET /api/cases` | kdf · swd | List — SWD's view excludes withdrawn |
| `GET /api/cases/[cnic]` | kdf · swd | Fetch one case |
| `PUT /api/cases/[cnic]` | kdf | Edit, CNIC included — referred only |
| `DELETE /api/cases/[cnic]` | kdf | Withdraw (soft-delete) — referred only |
| `POST /api/cases/[cnic]/restore` | kdf | Withdrawn → referred |
| `POST /api/cases/[cnic]/decision` | swd | Referred → verified/rejected |
| `PUT /api/cases/[cnic]/certificate-no` | swd | Set the certificate / register number |
| `PUT /api/cases/[cnic]/assessment` | swd | Save the application form's S. No. 9–11, 17–21 and field 8 ticks |
| `GET /api/cases/export` | swd | Completed cases as a styled Excel file (filters optional) |
| `POST /api/users` | admin | Create an account, any role |
| `GET /api/users` | admin | List accounts |
| `PUT /api/account/password` | any | Change own password — current one required |

Every API route re-checks the caller's role server-side via
`getServerSession` — the UI hiding a button is not access control.

## Security notes

- Passwords are bcrypt-hashed (cost factor 10) and never stored, logged, or
  printed anywhere in plaintext — including by the seed script, which reads
  the bootstrap admin's password from an environment variable and hashes it
  before it ever touches the database.
- CNIC and phone numbers are encrypted at rest and stored under hashed
  document IDs — see "Encryption of CNIC and phone numbers" above. The
  encryption key lives in the environment, not in Firebase, so read access
  to the database alone does not reveal either field.
- Only an `admin` can create accounts; the role is re-checked server-side.
- Sessions are JWT-based NextAuth cookies (`httpOnly`, `sameSite: "strict"`,
  and `secure` in production).
- `middleware.js` redirects unauthenticated visitors to `/login` and
  redirects a logged-in user away from a page belonging to a different role.
- All API input is validated server-side with zod, including the CNIC regex
  (`/^\d{5}-\d{7}-\d$/`), even though the KDF form also masks and validates
  it client-side.
- Login attempts are rate-limited per IP (in-memory, 10 attempts/minute) —
  adequate for a small single-instance deployment; swap for a distributed
  limiter before scaling to multiple server instances.
- API error responses never include stack traces; errors are logged
  server-side only (`console.error`).

- The Firestore database should be created in **production mode** (all
  client access denied by security rules). The app never uses client-side
  Firebase — only the server-side Admin SDK, which bypasses security rules
  — so locked-down rules cost nothing and block anyone who finds the
  project ID from reading data directly.
- The service-account private key grants full access to the project. It
  lives only in environment variables, never in the repo; if it's ever
  exposed, revoke it in Google Cloud Console → IAM → Service accounts and
  generate a new one.

**Before handling real applicant data at any scale:** consider field-level
encryption for `cnic` and the medical fields — this pass stores them as
plain strings (Firestore encrypts data at rest by default), a reasonable
starting point for a pilot but not for production-scale sensitive
medical/identity data.

## Handing this off to KDF

1. Have KDF's own admin choose and enter their own `ADMIN_*` credentials in
   the production `.env.local` (or Vercel's environment variables) and run
   `npm run seed` themselves — the password never appears in a file, chat,
   or script a developer sees.
2. That admin creates every real KDF and SWD account from `/admin/new`,
   handing each person a temporary password; everyone changes their own
   from `/account` on first login.
3. Rotate anything a developer set up during development — their own
   Firebase project or service-account key, `NEXTAUTH_SECRET` — rather than
   repurposing it for the live system. Ideally KDF's own Google account owns
   the Firebase project from the start.

## Deploying

Deploys cleanly to Vercel with Firebase:

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.
2. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
   `DATA_ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (your
   production URL) as environment variables in the Vercel project settings.
   Paste the private key exactly as it appears in the downloaded JSON.
   `DATA_ENCRYPTION_KEY` must be the **same value** used wherever the data
   was entered — a different key makes every existing case unreadable.
3. Run `npm run seed` once against the production project to create the
   bootstrap admin account.

## Testing locally without a Firebase project

The app also runs against Google's local Firestore emulator (needs Java
11+). Start it with `npx firebase-tools emulators:start --only firestore
--project demo-kdf`, then set in `.env.local`:

```
FIREBASE_PROJECT_ID=demo-kdf
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

With `FIRESTORE_EMULATOR_HOST` set, no service-account key is needed —
but `DATA_ENCRYPTION_KEY` is still required, since encryption does not
depend on which database it writes to. Use a throwaway key for the
emulator, not the production one. Remove the `FIRESTORE_EMULATOR_HOST`
line before connecting to a real project.

## What's intentionally not included

No self-service registration (accounts are always admin-created) — but
password *changes* are self-service. No digital DHQ step: the medical
board's exam and certificate are entirely paper-based by design. No
file/document uploads beyond the printable certificate, no email/SMS
notifications, and no public-facing pages beyond `/login`.
