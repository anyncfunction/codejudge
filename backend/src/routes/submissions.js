const router = require('express').Router();
const { submit, listSubmissions, getSubmission } = require('../controllers/submissionController');
const { authenticate, adminOnly } = require('../middleware/auth');
const { queryAll, queryOne, run } = require('../config/db');
const { validate, validateSubmission } = require('../middleware/validate');
const { judgeCode, judgeChoice, judgeFillBlank } = require('../services/judgeService');

router.post('/', authenticate, validate(validateSubmission), submit);
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
router.post('/admin/rejudge/:id', authenticate, adminOnly, (req, res) => {
  const submission = queryOne('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
  if (!submission) return res.status(404).json({ error: '提交记录不存在' });
  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [submission.problem_id]);
  if (!problem) return res.status(404).json({ error: '题目不存在' });

  let result;
  try {
    let testCases;
    try { testCases = JSON.parse(problem.test_cases); } catch { testCases = []; }

    if (submission.type === 'programming' || problem.type === 'programming') {
      result = judgeCode(submission.code, submission.language || 'javascript', testCases);
    } else if (submission.type === 'choice' || problem.type === 'choice') {
      let options; try { options = JSON.parse(problem.options); } catch { options = []; }
      result = judgeChoice(submission.answer, problem.blanks_answer, options);
    } else {
      let answers; try { answers = JSON.parse(problem.blanks_answer); } catch { answers = []; }
      result = judgeFillBlank(submission.answer, answers, problem.solution);
    }

    run('UPDATE submissions SET status = ?, score = ?, details = ? WHERE id = ?',
      [result.status, result.score, JSON.stringify(result.details), submission.id]);
    if (result.status === 'accepted') {
      run('UPDATE problems SET accepted_count = accepted_count + 1 WHERE id = ?', [submission.problem_id]);
    }

    res.json({ message: '重新判题完成', result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/:id', authenticate, getSubmission);

module.exports = router;
