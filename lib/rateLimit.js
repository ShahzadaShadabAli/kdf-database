// Simple in-memory fixed-window limiter, adequate for a small single-instance
// deployment. Keyed by IP; resets after `windowMs`.
const buckets = new Map();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

export function isRateLimited(key) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_ATTEMPTS;
}
