function validateRegister(body) {
  const errors = [];
  const { username, email, password } = body;
  if (!username || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    errors.push('用户名必须为3-20个字母或数字');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('邮箱格式不正确');
  }
  if (!password || password.length < 6) {
    errors.push('密码至少6个字符');
  }
  return errors.length ? errors : null;
}

function validateLogin(body) {
  const errors = [];
  const { email, password } = body;
  if (!email) errors.push('请输入邮箱');
  if (!password) errors.push('请输入密码');
  return errors.length ? errors : null;
}

function validateProblem(body) {
  const errors = [];
  const { title, description, type, difficulty } = body;
  if (!title) errors.push('标题不能为空');
  if (!description) errors.push('描述不能为空');
  if (type && !['programming', 'choice', 'fill_blank'].includes(type)) {
    errors.push('题目类型必须为 programming/choice/fill_blank');
  }
  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    errors.push('难度必须为 easy/medium/hard');
  }
  return errors.length ? errors : null;
}

function validateSubmission(body) {
  const errors = [];
  const { problem_id } = body;
  if (problem_id === undefined || problem_id === null || isNaN(Number(problem_id))) {
    errors.push('problem_id 必须为数字');
  }
  return errors.length ? errors : null;
}

function validate(fn) {
  return (req, res, next) => {
    const errors = fn(req.body);
    if (errors) {
      return res.status(400).json({ errors });
    }
    next();
  };
}

module.exports = { validate, validateRegister, validateLogin, validateProblem, validateSubmission };
