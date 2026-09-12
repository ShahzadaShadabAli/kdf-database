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

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME } = process.env;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Set it in .env.local before running the seed script.");
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

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ["kdf", "swd", "admin"] },
  displayName: { type: String, required: true },
  office: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const username = ADMIN_USERNAME.toLowerCase().trim();
  const existing = await User.findOne({ username });

  if (existing) {
    console.log(`\nUser "${username}" already exists — nothing to do.`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      username,
      passwordHash,
      role: "admin",
      displayName: ADMIN_DISPLAY_NAME,
    });
    console.log(`\nCreated admin account "${username}".`);
  }

  await mongoose.disconnect();
  console.log(
    'Sign in and use the admin\'s "+ New User" screen to create KDF and Social Welfare accounts.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
