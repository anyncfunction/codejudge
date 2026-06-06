const { queryAll, queryOne, run } = require('../config/db');
const { judgeCode, judgeChoice, judgeFillBlank } = require('../services/judgeService');
const { v4: uuidv4 } = require('uuid');

function submit(req, res) {
  const { problem_id, code, language, answer } = req.body;

  if (!problem_id) {
    return res.status(400).json({ error: '请指定题目' });
  }

  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [problem_id]);
  if (!problem) return res.status(404).json({ error: '题目不存在' });

  const submissionId = uuidv4();

  let result;
  if (problem.type === 'programming') {
    if (!code || !language) return res.status(400).json({ error: '请提供代码和语言' });
    let testCases;
    try { testCases = JSON.parse(problem.test_cases); } catch { testCases = []; }
    result = judgeCode(code, language, testCases);
  } else if (problem.type === 'choice') {
    if (answer === undefined || answer === null) return res.status(400).json({ error: '请选择一个答案' });
    let options;
    try { options = JSON.parse(problem.options); } catch { options = []; }
    result = judgeChoice(Number(answer), problem.solution, options);
  } else if (problem.type === 'fill_blank') {
    if (!answer) return res.status(400).json({ error: '请填写答案' });
    let blanksAnswer;
    try { blanksAnswer = JSON.parse(problem.blanks_answer); } catch { blanksAnswer = []; }
    result = judgeFillBlank(answer, blanksAnswer, problem.solution);
  } else {
    return res.status(400).json({ error: '未知题目类型' });
  }

  const status = result.passed ? 'accepted' : 'wrong_answer';
  const score = result.score || (result.passed ? 100 : 0);

  run(
    'INSERT INTO submissions (id, user_id, problem_id, code, language, answer, status, score, details, time_ms, memory_kb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [submissionId, req.user.id, problem_id, code || '', language || '',
     String(answer || ''), status, score,
     JSON.stringify(result.details || {}),
     result.timeMs || 0, result.memoryKb || 0]
  );

  if (status === 'accepted') {
    run('UPDATE problems SET accepted_count = accepted_count + 1 WHERE id = ?', [problem_id]);
  }
  run('UPDATE problems SET submission_count = submission_count + 1 WHERE id = ?', [problem_id]);

  res.json({
    id: submissionId,
    status,
    score,
    details: result.details,
    time_ms: result.timeMs || 0,
    memory_kb: result.memoryKb || 0,
  });
}

function listSubmissions(req, res) {
  const { problem_id, user_id, status, page = 1, limit = 20 } = req.query;
  let sql = `SELECT s.*, p.title as problem_title, u.username
    FROM submissions s
    LEFT JOIN problems p ON s.problem_id = p.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE 1=1`;
  let countSql = `SELECT COUNT(*) as count
    FROM submissions s
    LEFT JOIN problems p ON s.problem_id = p.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE 1=1`;
  const params = [];

  if (problem_id) { const c = ' AND s.problem_id = ?'; sql += c; countSql += c; params.push(problem_id); }
  if (user_id) { const c = ' AND s.user_id = ?'; sql += c; countSql += c; params.push(user_id); }
  else { const c = ' AND s.user_id = ?'; sql += c; countSql += c; params.push(req.user.id); }
  if (status) { const c = ' AND s.status = ?'; sql += c; countSql += c; params.push(status); }

  const total = queryOne(countSql, params).count;
  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const submissions = queryAll(sql, params);
  res.json({ submissions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
}

function getSubmission(req, res) {
  const sub = queryOne(
    `SELECT s.*, p.title as problem_title
    FROM submissions s LEFT JOIN problems p ON s.problem_id = p.id
    WHERE s.id = ?`,
    [req.params.id]
  );
  if (!sub) return res.status(404).json({ error: '提交不存在' });
  let details = sub.details;
  try { details = JSON.parse(sub.details); } catch {}
  res.json({ ...sub, details });
}

module.exports = { submit, listSubmissions, getSubmission };
