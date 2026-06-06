const router = require('express').Router();
const { queryOne } = require('../config/db');
const { listProblems, getProblem, createProblem, updateProblem, deleteProblem, getProblemStats, getTagsCloud } = require('../controllers/problemController');
const { getTemplate } = require('../services/judgeService');
const { optionalAuth, adminOnly } = require('../middleware/auth');

router.get('/', optionalAuth, listProblems);
router.get('/stats', getProblemStats);
router.get('/templates/:language', (req, res) => {
  res.json({ template: getTemplate(req.params.language) });
});
router.get('/tags', getTagsCloud);
router.get('/daily', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed) + today.charCodeAt(i);
  seed = Math.abs(seed);

  const count = queryOne('SELECT COUNT(*) as count FROM problems');
  if (!count || !count.count) return res.json({ problem: null });

  const offset = seed % count.count;
  const problem = queryOne('SELECT * FROM problems LIMIT 1 OFFSET ?', [offset]);

  let parsed = { ...problem };
  try { parsed.test_cases = JSON.parse(problem.test_cases); } catch { parsed.test_cases = []; }
  try { parsed.options = JSON.parse(problem.options); } catch { parsed.options = []; }
  try { parsed.blanks_answer = JSON.parse(problem.blanks_answer); } catch { parsed.blanks_answer = []; }

  res.json({ problem: parsed, date: today });
});
router.get('/:id', optionalAuth, getProblem);
router.post('/', adminOnly, createProblem);
router.put('/:id', adminOnly, updateProblem);
router.delete('/:id', adminOnly, deleteProblem);

module.exports = router;
