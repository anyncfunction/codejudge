const router = require('express').Router();
const { submit, listSubmissions, getSubmission } = require('../controllers/submissionController');
const { authenticate, adminOnly } = require('../middleware/auth');
const { queryAll } = require('../config/db');

router.post('/', authenticate, submit);
router.get('/', authenticate, listSubmissions);
router.get('/admin/all', authenticate, adminOnly, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const total = queryAll('SELECT COUNT(*) as count FROM submissions')[0].count;
  const submissions = queryAll(
    `SELECT s.id, s.user_id, s.problem_id, s.status, s.score, s.language, s.created_at,
            u.username, p.title as problem_title
     FROM submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN problems p ON p.id = s.problem_id
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [Number(limit), offset]
  );
  res.json({ submissions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});
router.get('/:id', authenticate, getSubmission);

module.exports = router;
