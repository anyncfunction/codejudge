const router = require('express').Router();
const { register, login, getProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { queryAll } = require('../config/db');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, changePassword);

router.get('/solved-calendar', authenticate, (req, res) => {
  const rows = queryAll(
    'SELECT DISTINCT DATE(created_at) as date FROM submissions WHERE user_id = ? ORDER BY date',
    [req.user.id]
  );
  res.json({ dates: rows.map(r => r.date) });
});

router.get('/streak', authenticate, (req, res) => {
  const rows = queryAll(
    "SELECT DISTINCT DATE(created_at) as date FROM submissions WHERE user_id = ? ORDER BY date DESC LIMIT 60",
    [req.user.id]
  );
  const dates = rows.map(r => r.date);
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayChecked = dates.includes(today);
  const checkDate = new Date();
  if (!todayChecked) checkDate.setDate(checkDate.getDate() - 1);
  for (const d of dates) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (d === expected) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }
  if (todayChecked && streak === 0) streak = 1;
  res.json({ streak, todayChecked });
});

router.get('/language-stats', authenticate, (req, res) => {
  const stats = queryAll(
    'SELECT language, COUNT(*) as count FROM submissions WHERE user_id = ? AND language IS NOT NULL AND language != "" GROUP BY language ORDER BY count DESC',
    [req.user.id]
  );
  res.json({ languages: stats });
});

router.get('/leaderboard', async (req, res) => {
  try {
    const rows = queryAll(`
      SELECT u.username, u.id,
        COUNT(DISTINCT s.problem_id) as solved,
        SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        COUNT(*) as total_submissions
      FROM users u
      LEFT JOIN submissions s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY solved DESC, accepted DESC
      LIMIT 50
    `);
    res.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
