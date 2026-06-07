const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./utils/initDb');
const { queryOne } = require('./config/db');
const { rateLimit } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');

const app = express();
const PORT = process.env.PORT || 3001;
const serverStart = Date.now();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Rate limiting per route group
app.use('/api/auth', rateLimit({ windowMs: 60000, max: 30 }));
app.use('/api/problems', rateLimit({ windowMs: 60000, max: 60 }));
app.use('/api/submissions', rateLimit({ windowMs: 60000, max: 20 }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStart) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const today = new Date().toISOString().slice(0, 10);
  const submissionsToday = queryOne("SELECT COUNT(*) as count FROM submissions WHERE DATE(created_at) = ?", [today]).count;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${hours}h ${minutes}m`,
    version: '1.0.0',
    submissions_today: submissionsToday,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
