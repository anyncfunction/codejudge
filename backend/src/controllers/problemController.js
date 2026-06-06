const { queryAll, queryOne, run } = require('../config/db');

function listProblems(req, res) {
  const { type, difficulty, search, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT id, title, type, difficulty, tags, accepted_count, submission_count FROM problems WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as count FROM problems WHERE 1=1';
  let conditions = '';
  const params = [];

  if (type) { conditions += ' AND type = ?'; params.push(type); }
  if (difficulty) { conditions += ' AND difficulty = ?'; params.push(difficulty); }
  if (search) { conditions += ' AND title LIKE ?'; params.push(`%${search}%`); }

  const total = queryOne(countSql + conditions, params).count;

  sql += conditions + ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const problems = queryAll(sql, params);
  res.json({ problems, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
}

function getProblem(req, res) {
  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [req.params.id]);
  if (!problem) return res.status(404).json({ error: '题目不存在' });

  let parsed = { ...problem };
  try { parsed.test_cases = JSON.parse(problem.test_cases); } catch { parsed.test_cases = []; }
  try { parsed.options = JSON.parse(problem.options); } catch { parsed.options = []; }
  try { parsed.blanks_answer = JSON.parse(problem.blanks_answer); } catch { parsed.blanks_answer = []; }

  if (req.user) {
    const passed = queryOne("SELECT id FROM submissions WHERE user_id = ? AND problem_id = ? AND status = 'accepted' LIMIT 1", [req.user.id, problem.id]);
    parsed.user_passed = !!passed;
  }

  res.json(parsed);
}

function createProblem(req, res) {
  const { title, description, type, difficulty, tags, solution, test_cases, options, blanks_answer } = req.body;
  if (!title || !type || !difficulty) {
    return res.status(400).json({ error: '标题、类型和难度为必填项' });
  }
  const result = run(
    'INSERT INTO problems (title, description, type, difficulty, tags, solution, test_cases, options, blanks_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description || '', type, difficulty, tags || '', solution || '',
     JSON.stringify(test_cases || []), JSON.stringify(options || []), JSON.stringify(blanks_answer || [])]
  );
  res.status(201).json({ id: result.lastInsertRowid, message: '题目创建成功' });
}

function updateProblem(req, res) {
  const existing = queryOne('SELECT id FROM problems WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: '题目不存在' });

  const { title, description, type, difficulty, tags, solution, test_cases, options, blanks_answer } = req.body;
  run(
    'UPDATE problems SET title=?, description=?, type=?, difficulty=?, tags=?, solution=?, test_cases=?, options=?, blanks_answer=? WHERE id=?',
    [title, description || '', type, difficulty, tags || '', solution || '',
     JSON.stringify(test_cases || []), JSON.stringify(options || []), JSON.stringify(blanks_answer || []),
     req.params.id]
  );
  res.json({ message: '题目更新成功' });
}

function deleteProblem(req, res) {
  run('DELETE FROM problems WHERE id = ?', [req.params.id]);
  res.json({ message: '题目已删除' });
}

function getTagsCloud(req, res) {
  const rows = queryAll('SELECT tags FROM problems WHERE tags IS NOT NULL AND tags != ""');
  const freq = {};
  rows.forEach(r => {
    (r.tags || '').split(',').forEach(t => {
      const tag = t.trim();
      if (tag) freq[tag] = (freq[tag] || 0) + 1;
    });
  });
  const tags = Object.entries(freq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  res.json({ tags });
}

function getProblemStats(req, res) {
  const stats = queryOne(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN type = 'programming' THEN 1 ELSE 0 END) as programming,
      SUM(CASE WHEN type = 'choice' THEN 1 ELSE 0 END) as choice,
      SUM(CASE WHEN type = 'fill_blank' THEN 1 ELSE 0 END) as fill_blank
    FROM problems
  `);
  res.json(stats || { total: 0, programming: 0, choice: 0, fill_blank: 0 });
}

module.exports = { listProblems, getProblem, createProblem, updateProblem, deleteProblem, getProblemStats, getTagsCloud };
