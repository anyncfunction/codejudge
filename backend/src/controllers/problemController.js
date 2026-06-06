const { queryAll, queryOne, run, getSafeDb, saveDb } = require('../config/db');

function listProblems(req, res) {
  const { type, difficulty, search, page = 1, limit = 20, sort } = req.query;
  let sql = 'SELECT id, title, type, difficulty, tags, accepted_count, submission_count FROM problems WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as count FROM problems WHERE 1=1';
  let conditions = '';
  const params = [];

  if (type) { conditions += ' AND type = ?'; params.push(type); }
  if (difficulty) { conditions += ' AND difficulty = ?'; params.push(difficulty); }
  if (search) { conditions += ' AND title LIKE ?'; params.push(`%${search}%`); }

  const total = queryOne(countSql + conditions, params).count;

  let orderClause;
  if (sort === 'acceptance') {
    orderClause = 'ORDER BY (accepted_count * 100.0 / CASE WHEN submission_count > 0 THEN submission_count ELSE 1 END) DESC';
  } else if (sort === 'submissions') {
    orderClause = 'ORDER BY submission_count DESC';
  } else {
    orderClause = 'ORDER BY id DESC';
  }

  sql += conditions + ' ' + orderClause + ' LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const problems = queryAll(sql, params);
  res.json({ problems, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
}

function getProblem(req, res) {
  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [req.params.id]);
  if (!problem) return res.status(404).json({ error: '题目不存在' });

  // Increment view count
  try { run('UPDATE problems SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?', [req.params.id]); } catch {}

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

function getAdminStats(req, res) {
  const totalProblems = queryOne('SELECT COUNT(*) as count FROM problems').count;
  const totalUsers = queryOne('SELECT COUNT(*) as count FROM users').count;
  const totalSubmissions = queryOne('SELECT COUNT(*) as count FROM submissions').count;
  const acceptedCount = queryOne("SELECT COUNT(*) as count FROM submissions WHERE status = 'accepted'").count;

  const byType = queryAll(`
    SELECT p.type, COUNT(*) as count
    FROM submissions s JOIN problems p ON s.problem_id = p.id
    GROUP BY p.type
  `);

  const topUsers = queryAll(`
    SELECT u.username, COUNT(*) as submission_count
    FROM submissions s JOIN users u ON s.user_id = u.id
    GROUP BY u.id ORDER BY submission_count DESC LIMIT 5
  `);

  const recent24h = queryOne(`
    SELECT COUNT(*) as count FROM submissions
    WHERE created_at >= datetime('now', '-1 day')
  `).count;

  res.json({
    totalProblems,
    totalUsers,
    totalSubmissions,
    acceptedCount,
    acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0,
    byType: Object.fromEntries(byType.map(r => [r.type, r.count])),
    topUsers,
    recent24h,
  });
}

function optimizeDatabase(req, res) {
  const db = getSafeDb();
  db.run('ANALYZE');
  db.run('VACUUM');
  saveDb();
  res.json({ message: '数据库优化完成' });
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

function exportProblems(req, res) {
  const problems = queryAll('SELECT * FROM problems ORDER BY id');
  const data = problems.map(p => ({
    title: p.title, description: p.description, type: p.type,
    difficulty: p.difficulty, tags: p.tags, solution: p.solution,
    test_cases: JSON.parse(p.test_cases || '[]'),
    options: JSON.parse(p.options || '[]'),
    blanks_answer: JSON.parse(p.blanks_answer || '[]'),
  }));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=codejudge-problems-${new Date().toISOString().slice(0,10)}.json`);
  res.json({ count: data.length, problems: data });
}

function importProblems(req, res) {
  const { problems } = req.body;
  if (!Array.isArray(problems) || problems.length === 0) {
    return res.status(400).json({ error: '请提供有效的题目数据' });
  }
  let imported = 0;
  for (const p of problems) {
    if (!p.title || !p.type) continue;
    run(
      'INSERT INTO problems (title, description, type, difficulty, tags, solution, test_cases, options, blanks_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.title, p.description || '', p.type, p.difficulty || 'easy', p.tags || '',
       p.solution || '', JSON.stringify(p.test_cases || []), JSON.stringify(p.options || []),
       JSON.stringify(p.blanks_answer || [])]
    );
    imported++;
  }
  res.json({ message: `成功导入 ${imported} 道题目`, count: imported });
}

module.exports = { listProblems, getProblem, createProblem, updateProblem, deleteProblem, getProblemStats, getAdminStats, getTagsCloud, exportProblems, importProblems, optimizeDatabase };
