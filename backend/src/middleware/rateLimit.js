// Simple in-memory rate limiter
const requestCounts = new Map();

function rateLimit({ windowMs = 60000, max = 100, message = '请求过于频繁，请稍后再试' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, start: now });
      return next();
    }

    const data = requestCounts.get(key);
    if (now - data.start > windowMs) {
      // Reset window
      requestCounts.set(key, { count: 1, start: now });
      return next();
    }

    data.count++;
    if (data.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts) {
    if (now - data.start > 120000) { // 2 min stale
      requestCounts.delete(key);
    }
  }
}, 300000);

module.exports = { rateLimit };
