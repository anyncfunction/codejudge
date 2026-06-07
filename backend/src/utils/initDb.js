const { getDb, exec, queryOne, run } = require('../config/db');
const bcrypt = require('bcryptjs');

async function initDb() {
  await getDb();

  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  try { exec('ALTER TABLE users ADD COLUMN last_login DATETIME'); } catch {}

  exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL CHECK(type IN ('programming', 'choice', 'fill_blank')),
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      tags TEXT DEFAULT '',
      solution TEXT DEFAULT '',
      test_cases TEXT DEFAULT '[]',
      options TEXT DEFAULT '[]',
      blanks_answer TEXT DEFAULT '[]',
      accepted_count INTEGER DEFAULT 0,
      submission_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      code TEXT DEFAULT '',
      language TEXT DEFAULT '',
      answer TEXT DEFAULT '',
      status TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      details TEXT DEFAULT '{}',
      time_ms INTEGER DEFAULT 0,
      memory_kb INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    )
  `);

  const adminExists = queryOne('SELECT id FROM users WHERE email = ?', ['admin@oj.com']);
  if (!adminExists) {
    run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['admin', 'admin@oj.com', bcrypt.hashSync('admin123', 10), 'admin']);
    run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', ['testuser', 'test@oj.com', bcrypt.hashSync('test123', 10), 'user']);
  }

  const problemExists = queryOne('SELECT id FROM problems LIMIT 1');
  if (!problemExists) {
    const seed = [
      { title: '两数之和', type: 'programming', difficulty: 'easy', tags: '数组,哈希表',
        description: '## 题目描述\n\n给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。\n\n### 输入格式\n- 第一行：整数数组 nums（空格分隔）\n- 第二行：目标值 target\n\n### 输出格式\n- 输出两个数的下标（空格分隔）\n\n### 示例\n\n输入:\n2 7 11 15\n9\n\n输出:\n0 1',
        solution: 'def solve(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i\n    return []',
        test_cases: JSON.stringify([{input:'2 7 11 15\n9',expected_output:'0 1'},{input:'3 2 4\n6',expected_output:'1 2'},{input:'3 3\n6',expected_output:'0 1'}])
      },
      { title: '反转字符串', type: 'programming', difficulty: 'easy', tags: '字符串',
        description: '## 题目描述\n\n编写一个函数，其作用是将输入的字符串反转过来。\n\n### 输入格式\n- 一个字符串\n\n### 输出格式\n- 反转后的字符串\n\n### 示例\n\n输入: hello\n输出: olleh',
        solution: 'def solve(s):\n    return s[::-1]',
        test_cases: JSON.stringify([{input:'hello',expected_output:'olleh'},{input:'world',expected_output:'dlrow'},{input:'OpenAI',expected_output:'IAnepO'}])
      },
      { title: '斐波那契数列', type: 'programming', difficulty: 'medium', tags: '递归,动态规划',
        description: '## 题目描述\n\n给定 n，请计算 F(n)。\n\n### 输入格式\n- 一个整数 n (0 <= n <= 30)\n\n### 输出格式\n- F(n) 的值\n\n### 示例\n\n输入: 2\n输出: 1\n\n输入: 4\n输出: 3',
        solution: 'def solve(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a',
        test_cases: JSON.stringify([{input:'0',expected_output:'0'},{input:'1',expected_output:'1'},{input:'10',expected_output:'55'}])
      },
      { title: 'HTTP 状态码选择题', type: 'choice', difficulty: 'easy', tags: '计算机网络,HTTP',
        description: '## 题目描述\n\nHTTP 响应状态码中，200 表示什么？',
        solution: '0',
        options: JSON.stringify(['请求成功','资源未找到','服务器错误','重定向'])
      },
      { title: 'JavaScript 数据类型填空', type: 'fill_blank', difficulty: 'easy', tags: 'JavaScript,数据类型',
        description: '## 题目描述\n\n在 JavaScript 中，使用 typeof null 会返回什么？',
        solution: 'object',
        blanks_answer: JSON.stringify(['object'])
      },
      { title: 'SQL 查询选择题', type: 'choice', difficulty: 'medium', tags: '数据库,SQL',
        description: '## 题目描述\n\n在 SQL 中，用于从数据库中删除所有行但保留表结构的命令是什么？',
        solution: '1',
        options: JSON.stringify(['DELETE','TRUNCATE','DROP','REMOVE'])
      },
    ];

    for (const p of seed) {
      run(
        'INSERT INTO problems (title, description, type, difficulty, tags, solution, test_cases, options, blanks_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.title, p.description||'', p.type, p.difficulty, p.tags||'', p.solution||'',
         p.test_cases||'[]', p.options||'[]', p.blanks_answer||'[]']
      );
    }
  }

  // Add default users if not exist
  const adminExists = queryOne("SELECT id FROM users WHERE email = 'admin@oj.com'");
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    run("INSERT OR IGNORE INTO users (username, email, password, role, last_login) VALUES (?, ?, ?, 'admin', ?)",
      ['admin', 'admin@oj.com', hash, new Date().toISOString()]);
  }
  const testExists = queryOne("SELECT id FROM users WHERE email = 'test@oj.com'");
  if (!testExists) {
    const hash = bcrypt.hashSync('test123', 10);
    run("INSERT OR IGNORE INTO users (username, email, password, role, last_login) VALUES (?, ?, ?, 'user', ?)",
      ['test', 'test@oj.com', hash, new Date().toISOString()]);
  }

  console.log('Database initialized successfully');
}

module.exports = { initDb };
