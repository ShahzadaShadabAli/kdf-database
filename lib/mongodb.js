import mongoose from "mongoose";

// Reuse the connection across hot reloads / serverless invocations.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Keep a small pool of ready connections open instead of negotiating
        // a fresh one per request.
        maxPoolSize: 10,
        // Fail fast on a bad connection instead of the driver's 30s default —
        // that default is what made a flaky connection feel like the whole
        // app had hung.
        serverSelectionTimeoutMS: 8000,
        // Skip the slow IPv6-then-fallback-to-IPv4 dance some Windows
        // machines do, which otherwise adds a multi-second stall to every
        // fresh connection attempt.
        family: 4,
      })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Don't let one failed connection attempt (e.g. a transient DNS
    // ESERVFAIL on the Atlas SRV lookup) poison every request for the rest
    // of the process — clear it so the next call retries fresh.
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
