const router = require('express').Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { queryAll } = require('../config/db');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);

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
