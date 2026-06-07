const { describe, it, before, after } = require('node:test');
const assert = require('assert');

const BASE = 'http://localhost:3001/api';

describe('CodeJudge API Tests', () => {
  let token;

  it('GET /health returns ok', async () => {
    const res = await fetch(`${BASE}/../api/health`);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });

  it('GET /problems/stats returns numbers', async () => {
    const res = await fetch(`${BASE}/problems/stats`);
    const data = await res.json();
    assert.ok(typeof data.total === 'number');
    assert.ok(data.total >= 10000);
  });

  it('POST /auth/login with valid credentials returns token', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@oj.com', password: 'admin123' }),
    });
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.role, 'admin');
    token = data.token;
  });

  it('GET /auth/profile requires auth', async () => {
    const res = await fetch(`${BASE}/auth/profile`);
    assert.equal(res.status, 401);
  });

  it('GET /auth/profile with token returns user', async () => {
    const res = await fetch(`${BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    assert.equal(data.role, 'admin');
  });

  it('GET /problems returns paginated list', async () => {
    const res = await fetch(`${BASE}/problems?limit=5&page=1`);
    const data = await res.json();
    assert.equal(data.problems.length, 5);
    assert.ok(data.total >= 10000);
  });

  it('GET /problems/:id returns problem', async () => {
    const res = await fetch(`${BASE}/problems/1`);
    const data = await res.json();
    assert.ok(data.title);
  });

  it('GET /auth/leaderboard returns array', async () => {
    const res = await fetch(`${BASE}/auth/leaderboard`);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('POST /submissions choice answer works', async () => {
    const login = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@oj.com', password: 'admin123' }),
    });
    const { token } = await login.json();
    const res = await fetch(`${BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ problem_id: 5000, answer: 0 }),
    });
    const data = await res.json();
    assert.ok(['accepted', 'wrong_answer'].includes(data.status), `Expected accepted/wrong_answer, got ${data.status} - response: ${JSON.stringify(data)}`);
  });
});
