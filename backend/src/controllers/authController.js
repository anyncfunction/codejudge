const { queryOne, run } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }
  const existing = queryOne('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
  if (existing) {
    return res.status(400).json({ error: '用户名或邮箱已存在' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const result = run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, 'user']);
  const token = jwt.sign({ id: result.lastInsertRowid, username, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, username, email, role: 'user' },
  });
}

function login(req, res) {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '请输入邮箱和密码' });
  }
  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  // Update last login
  run('UPDATE users SET last_login = datetime() WHERE id = ?', [user.id]);
  const expiresIn = rememberMe ? '30d' : '7d';
  const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn });
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, last_login: new Date().toISOString() },
  });
}

function getProfile(req, res) {
  const user = queryOne('SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const totalRow = queryOne('SELECT COUNT(*) as count FROM submissions WHERE user_id = ?', [req.user.id]);
  const acceptedRow = queryOne("SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND status = 'accepted'", [req.user.id]);
  const rankRow = queryOne(`
    SELECT COUNT(*) + 1 as rank FROM (
      SELECT user_id, COUNT(*) as accepted_count FROM submissions
      WHERE status = 'accepted' GROUP BY user_id
    ) t WHERE t.accepted_count > (SELECT COUNT(*) FROM submissions WHERE user_id = ? AND status = 'accepted')
  `, [req.user.id]);

  res.json({ ...user, stats: { total: totalRow.count, accepted: acceptedRow.count, rank: rankRow?.rank || 0 } });
}

function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '请提供当前密码和新密码' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少6位' });
  }

  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: '当前密码错误' });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
  res.json({ message: '密码修改成功' });
}

module.exports = { register, login, getProfile, changePassword };
