const router = require('express').Router();
const { queryOne } = require('../config/db');
const { listProblems, getProblem, createProblem, updateProblem, deleteProblem, getProblemStats, getAdminStats, getTagsCloud, exportProblems, importProblems, optimizeDatabase, getSimilarProblems, getRandomUnsolved } = require('../controllers/problemController');
const { getTemplate, runCode } = require('../services/judgeService');
const { optionalAuth, authenticate, adminOnly } = require('../middleware/auth');

router.post('/run', authenticate, (req, res) => {
  const { code, language, input } = req.body;
  if (!code || !language) return res.status(400).json({ error: '缺少代码或语言' });
  try {
    const result = runCode(code, language, input || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
router.get('/random', (req, res) => {
  const count = queryOne('SELECT COUNT(*) as count FROM problems');
  if (!count || !count.count) return res.json({ problem: null });
  const offset = Math.floor(Math.random() * count.count);
  const problem = queryOne('SELECT * FROM problems LIMIT 1 OFFSET ?', [offset]);
  try { problem.test_cases = JSON.parse(problem.test_cases); } catch { problem.test_cases = []; }
  try { problem.options = JSON.parse(problem.options); } catch { problem.options = []; }
  try { problem.blanks_answer = JSON.parse(problem.blanks_answer); } catch { problem.blanks_answer = []; }
  res.json({ problem });
});
router.get('/random-unsolved', authenticate, getRandomUnsolved);
router.get('/admin/stats', adminOnly, getAdminStats);
router.get('/export', adminOnly, exportProblems);
router.post('/import', adminOnly, importProblems);
router.get('/docs', (req, res) => {
  res.json({
    name: 'CodeJudge API',
    version: '1.0',
    baseUrl: '/api',
    endpoints: [
      { method: 'POST', path: '/auth/register', auth: false, desc: '用户注册' },
      { method: 'POST', path: '/auth/login', auth: false, desc: '用户登录' },
      { method: 'GET', path: '/auth/profile', auth: true, desc: '获取用户信息' },
      { method: 'PUT', path: '/auth/password', auth: true, desc: '修改密码' },
      { method: 'GET', path: '/auth/leaderboard', auth: false, desc: '排行榜' },
      { method: 'GET', path: '/auth/streak', auth: true, desc: '打卡连续天数' },
      { method: 'GET', path: '/auth/solved-calendar', auth: true, desc: '解题日历' },
      { method: 'GET', path: '/problems', auth: false, desc: '题目列表' },
      { method: 'GET', path: '/problems/stats', auth: false, desc: '题目统计' },
      { method: 'GET', path: '/problems/tags', auth: false, desc: '标签云' },
      { method: 'GET', path: '/problems/daily', auth: false, desc: '每日一题' },
      { method: 'GET', path: '/problems/random', auth: false, desc: '随机一题' },
      { method: 'GET', path: '/problems/export', auth: 'admin', desc: '导出题目' },
      { method: 'POST', path: '/problems/import', auth: 'admin', desc: '导入题目' },
      { method: 'GET', path: '/problems/admin/stats', auth: 'admin', desc: '管理统计' },
      { method: 'GET', path: '/problems/templates/:lang', auth: false, desc: '代码模板' },
      { method: 'GET', path: '/problems/:id', auth: false, desc: '题目详情' },
      { method: 'POST', path: '/problems', auth: 'admin', desc: '创建题目' },
      { method: 'PUT', path: '/problems/:id', auth: 'admin', desc: '更新题目' },
      { method: 'DELETE', path: '/problems/:id', auth: 'admin', desc: '删除题目' },
      { method: 'POST', path: '/submissions', auth: true, desc: '提交答案' },
      { method: 'GET', path: '/submissions', auth: true, desc: '提交记录' },
      { method: 'GET', path: '/submissions/:id', auth: true, desc: '提交详情' },
      { method: 'GET', path: '/health', auth: false, desc: '健康检查' },
    ],
  });
});
router.get('/:id', optionalAuth, getProblem);

module.exports = router;
