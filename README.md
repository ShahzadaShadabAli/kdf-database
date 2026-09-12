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

Next.js (App Router, JavaScript), MongoDB via Mongoose, NextAuth.js
(Credentials provider, JWT sessions), zod for server-side validation.

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

   - `MONGODB_URI` — a MongoDB Atlas (or local) connection string.
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

Name, gender, marital status, son/daughter of, spouse (optional), date of
birth, CNIC, qualification (optional), phone, email (optional), assistive devices
provided (optional), type of disability (Physically / Visually / Hearing /
Mentally), nature of disability, cause of disability (optional), type of
job can do (optional), source of income (optional), and two addresses —
present and permanent, each broken into UC / Tehsil / District rather than
one free-text field, with a "same as present" option.

These match fields 1–16 of the government's own paper form — Application
for Disability Certificate/Supportive Aid (Social Welfare Department
Gilgit-Baltistan, NCRDP, SSMC RHQ Hospital Skardu) — so that Social
Welfare's printable application form (`/swd/[cnic]/certificate`) is a
faithful reproduction of that exact form, fields 1–16 filled in from the
case record. Fields 17–21 (the Assessment Board's declaration and
category) and every signature line print blank, for the board and
applicant to fill by hand.

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

**Before handling real applicant data at any scale:** restrict MongoDB Atlas
network access to known IPs, use a database user scoped to only this
database, confirm encryption at rest is enabled (on by default on Atlas),
and consider field-level encryption for `cnic` and the medical fields —
this pass stores them as plain strings, a reasonable starting point for a
pilot but not for production-scale sensitive medical/identity data.

## Handing this off to KDF

1. Have KDF's own admin choose and enter their own `ADMIN_*` credentials in
   the production `.env.local` (or Vercel's environment variables) and run
   `npm run seed` themselves — the password never appears in a file, chat,
   or script a developer sees.
2. That admin creates every real KDF and SWD account from `/admin/new`,
   handing each person a temporary password; everyone changes their own
   from `/account` on first login.
3. Rotate anything a developer set up during development — their own Atlas
   cluster/database user, `NEXTAUTH_SECRET` — rather than repurposing it for
   the live system.

## Deploying

Deploys cleanly to Vercel with MongoDB Atlas:

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel.
2. Set `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (your production
   URL) as environment variables in the Vercel project settings.
3. Run `npm run seed` once against the production database to create the
   bootstrap admin account.

## What's intentionally not included

No self-service registration (accounts are always admin-created) — but
password *changes* are self-service. No digital DHQ step: the medical
board's exam and certificate are entirely paper-based by design. No
file/document uploads beyond the printable certificate, no email/SMS
notifications, and no public-facing pages beyond `/login`.
