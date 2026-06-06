const router = require('express').Router();
const { register, login, getProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { queryAll, run } = require('../config/db');

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

router.get('/recent-submissions', authenticate, (req, res) => {
  const rows = queryAll(`
    SELECT s.id, s.problem_id, s.status, s.score, s.created_at, p.title as problem_title
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
    LIMIT 5
  `, [req.user.id]);
  res.json({ submissions: rows });
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

router.get('/admin/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  const users = queryAll('SELECT id, username, email, role, created_at FROM users ORDER BY id');
  res.json({ users });
});

router.delete('/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  run('DELETE FROM users WHERE id = ? AND role != ?', [req.params.id, 'admin']);
  res.json({ message: '用户已删除' });
});

module.exports = router;
