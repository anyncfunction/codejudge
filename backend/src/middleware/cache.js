// Simple in-memory cache
const cache = new Map();

function memoize(key, fn, ttlMs = 30000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < ttlMs) {
    return cached.data;
  }
  const data = fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

function invalidate(key) {
  cache.delete(key);
}

// Every 5 min clean stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of cache) {
    if (now - val.ts > 120000) cache.delete(key);
  }
}, 300000);

module.exports = { memoize, invalidate };
