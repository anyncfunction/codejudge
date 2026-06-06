const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TIMEOUT_MS = 8000;

const TEMPLATES = {
  javascript: `// 输入数据通过标准输入(stdin)提供
// 使用 console.log 输出结果
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  // 在这里编写你的代码，使用 lines 读取输入
  // 使用 console.log() 输出结果
  solve(lines);
});

function solve(lines) {
  // TODO: 实现你的算法
  console.log(lines.join(' '));
}
`,

  python: `# 输入数据通过标准输入(stdin)提供
# 使用 print() 输出结果
import sys

def solve():
    lines = sys.stdin.read().strip().split('\\n')
    # 在这里编写你的代码，使用 lines 读取输入
    # 使用 print() 输出结果
    # TODO: 实现你的算法
    print(' '.join(lines))

if __name__ == '__main__':
    solve()
`,
};

function getTemplate(language) {
  return TEMPLATES[language] || TEMPLATES.javascript;
}

function judgeCode(code, language, testCases) {
  if (!testCases || testCases.length === 0) {
    return { passed: false, score: 0, details: { error: '没有测试用例', total: 0, passed: 0, cases: [] } };
  }

  let passed = 0;
  const total = testCases.length;
  const details = [];
  let totalTime = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const result = runCode(code, language, tc.input);
      const actual = result.stdout.trim();
      const expected = String(tc.expected_output).trim();
      const isPass = actual === expected;
      if (isPass) passed++;
      totalTime += result.time;
      details.push({
        case: i + 1,
        input: tc.input,
        expected: expected,
        actual: actual,
        passed: isPass,
        time: result.time,
      });
      if (result.stderr) {
        details[details.length - 1].stderr = result.stderr;
      }
    } catch (e) {
      details.push({
        case: i + 1,
        input: tc.input,
        error: e.message || '运行错误',
        expected: String(tc.expected_output).trim(),
        actual: '',
        passed: false,
      });
    }
  }

  return {
    passed: passed === total,
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    details: { total, passed, cases: details },
    timeMs: totalTime,
    memoryKb: 0,
  };
}

function runCode(code, language, input) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cj-'));
  const startTime = Date.now();

  try {
    let cmd, filename;

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js': {
        filename = path.join(tmpDir, 'main.js');
        fs.writeFileSync(filename, code);
        cmd = `node "${filename}"`;
        break;
      }
      case 'python':
      case 'python3':
      case 'py': {
        filename = path.join(tmpDir, 'main.py');
        fs.writeFileSync(filename, code);
        cmd = `python "${filename}"`;
        break;
      }
      default:
        throw new Error(`不支持的语言: ${language}`);
    }

    const stdout = execSync(cmd, {
      input: (input || '') + '\n',
      timeout: TIMEOUT_MS,
      maxBuffer: 5 * 1024 * 1024,
      encoding: 'utf-8',
      windowsHide: true,
    });

    const elapsed = Date.now() - startTime;
    return { stdout: stdout || '', stderr: '', time: elapsed };
  } catch (e) {
    const elapsed = Date.now() - startTime;
    if (e.killed || (e.message && e.message.includes('ETIMEDOUT'))) {
      return { stdout: (e.stdout || '').toString(), stderr: '代码运行超时', time: elapsed };
    }
    return {
      stdout: (e.stdout || '').toString(),
      stderr: (e.stderr || e.message || '运行时错误').toString(),
      time: elapsed,
    };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

function judgeChoice(userAnswer, correctAnswer, options) {
  const passed = String(userAnswer) === String(correctAnswer);
  return {
    passed,
    score: passed ? 100 : 0,
    details: {
      user_answer: String(userAnswer),
      correct_answer: String(correctAnswer),
      options,
      passed,
    },
  };
}

function judgeFillBlank(userAnswer, acceptableAnswers, solution) {
  const answers = Array.isArray(acceptableAnswers) ? acceptableAnswers : [acceptableAnswers];
  const trimmed = String(userAnswer).trim();
  const passed = answers.some(a => String(a).trim().toLowerCase() === trimmed.toLowerCase());
  return {
    passed,
    score: passed ? 100 : 0,
    details: {
      user_answer: trimmed,
      acceptable_answers: answers,
      reference: solution || '',
      passed,
    },
  };
}

module.exports = { judgeCode, judgeChoice, judgeFillBlank, getTemplate };
