// Opens a backup made by scripts/backup.js and writes it out as plain JSON.
//
// Run with: node scripts/decrypt-backup.js kdf-backup-2026-09-19.json.gz.enc
// It asks for BACKUP_PASSWORD (or reads it from the environment) and saves
// kdf-backup-2026-09-19.json beside the backup.
//
// The JSON it writes holds names, addresses and staff accounts in plain
// text — keep it on your own computer and delete it when you're done. CNIC
// and phone numbers are still encrypted in it, exactly as in the database.

const fs = require("fs");
const readline = require("readline");
const zlib = require("zlib");
const { createDecipheriv, scryptSync } = require("crypto");

// Shared with scripts/backup.js — change both together.
const MAGIC = Buffer.from("KDFBAK01");
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Asks for the password without echoing it to the screen.
function askPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (s) => {
      if (!rl.stdoutMuted) rl.output.write(s);
    };
    rl.question("Backup password: ", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl.stdoutMuted = true;
  });
}

function decrypt(data, password) {
  if (!data.subarray(0, MAGIC.length).equals(MAGIC)) {
    fail("This isn't a Case Register backup file (or it was damaged in transit).");
  }
  let at = MAGIC.length;
  const salt = data.subarray(at, (at += 16));
  const iv = data.subarray(at, (at += 12));
  const tag = data.subarray(at, (at += 16));
  const key = scryptSync(password, salt, 32, SCRYPT);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(data.subarray(at)), decipher.final()]);
  } catch {
    fail("Wrong password, or the file has been changed.");
  }
}

async function main() {
  const input = process.argv[2];
  if (!input) fail("Usage: node scripts/decrypt-backup.js <kdf-backup-YYYY-MM-DD.json.gz.enc> [output.json]");
  if (!fs.existsSync(input)) fail(`File not found: ${input}`);
  const output = process.argv[3] || input.replace(/\.json\.gz\.enc$/, "") + ".json";

  const password = process.env.BACKUP_PASSWORD || (await askPassword());
  const backup = JSON.parse(zlib.gunzipSync(decrypt(fs.readFileSync(input), password)).toString("utf8"));

  fs.writeFileSync(output, JSON.stringify(backup, null, 2));
  console.log(`Backup taken ${backup.exportedAt}`);
  for (const [name, n] of Object.entries(backup.counts)) console.log(`  ${name}: ${n} documents`);
  console.log(`Saved ${output} — it contains personal details in plain text, so delete it when you're done.`);
}

main();
