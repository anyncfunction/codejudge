import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import CodeEditor from '../components/CodeEditor';
import ChoiceQuestion from '../components/ChoiceQuestion';
import FillBlankQuestion from '../components/FillBlankQuestion';
import SubmissionStatus from '../components/SubmissionStatus';
import MarkdownRenderer from '../components/MarkdownRenderer';
import type { Problem, Submission, TestCaseResult } from '../types';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-600',
  medium: 'bg-yellow-600',
  hard: 'bg-red-600',
};

const TYPE_LABELS: Record<string, string> = {
  programming: '编程题',
  choice: '选择题',
  fill_blank: '填空题',
};

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Programming
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');

  // Choice
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Fill blank
  const [fillAnswer, setFillAnswer] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);

  const fetchProblem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const problem = await api.problems.get(Number(id));
      setProblem(problem);
    } catch (err: any) {
      if (err.message?.includes('404')) {
        setNotFound(true);
      } else {
        setError(err.message || '加载题目失败');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTemplate = useCallback(async (lang: string) => {
    try {
      const { template } = await api.problems.getTemplate(lang);
      setCode(template);
    } catch {
      setCode('');
    }
  }, []);

  useEffect(() => {
    fetchProblem();
    setSubmissionResult(null);
    setSelectedAnswer(null);
    setFillAnswer('');
  }, [fetchProblem]);

  useEffect(() => {
    if (problem?.type === 'programming') {
      loadTemplate(language);
    }
  }, [problem?.type, language, loadTemplate]);

  const handleSubmit = async () => {
    if (!problem) return;

    if (problem.type === 'programming' && !code.trim()) {
      toast.error('请编写代码');
      return;
    }
    if (problem.type === 'choice' && selectedAnswer === null) {
      toast.error('请选择一个答案');
      return;
    }
    if (problem.type === 'fill_blank' && !fillAnswer.trim()) {
      toast.error('请填写答案');
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const payload: { problem_id: number; code?: string; language?: string; answer?: string | number } = {
        problem_id: problem.id,
      };

      if (problem.type === 'programming') {
        payload.code = code;
        payload.language = language;
      } else if (problem.type === 'choice') {
        payload.answer = selectedAnswer ?? undefined;
      } else if (problem.type === 'fill_blank') {
        payload.answer = fillAnswer;
      }

      const res = await api.submissions.submit(payload);
      setSubmissionResult(res);

      if (res.status === 'accepted') {
        toast.success('通过！');
        setProblem((prev) =>
          prev ? { ...prev, user_passed: true } : prev
        );
      } else if (res.status === 'wrong_answer') {
        toast.error('答案错误');
      } else {
        toast.success('提交成功');
      }
    } catch (err: any) {
      toast.error(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderResultPanel = () => {
    if (!submissionResult || !problem) return null;

    const details = submissionResult.details;

    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          判题结果
          <SubmissionStatus
            status={submissionResult.status}
            score={submissionResult.score}
          />
        </h3>

        {/* Error message */}
        {details?.error && (
          <div className="mb-4 p-3 bg-red-600/10 border border-red-600/30 rounded">
            <pre className="text-red-400 text-sm whitespace-pre-wrap">{details.error}</pre>
          </div>
        )}

        {/* Programming results */}
        {problem.type === 'programming' && details?.cases && details.cases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-2 text-gray-400">#</th>
                  <th className="text-left py-2 text-gray-400">输入</th>
                  <th className="text-left py-2 text-gray-400">预期输出</th>
                  <th className="text-left py-2 text-gray-400">实际输出</th>
                  <th className="text-left py-2 text-gray-400">结果</th>
                </tr>
              </thead>
              <tbody>
                {details.cases.map((tc: TestCaseResult) => (
                  <tr
                    key={tc.case}
                    className="border-b border-dark-800"
                  >
                    <td className="py-2 text-gray-300">{tc.case}</td>
                    <td className="py-2">
                      <pre className="text-gray-300 max-w-[200px] overflow-auto">
                        {tc.input}
                      </pre>
                    </td>
                    <td className="py-2">
                      <pre className="text-green-400 max-w-[200px] overflow-auto">
                        {tc.expected}
                      </pre>
                    </td>
                    <td className="py-2">
                      <pre className="text-gray-300 max-w-[200px] overflow-auto">
                        {tc.actual}
                      </pre>
                    </td>
                    <td className="py-2">
                      {tc.passed ? (
                        <CheckCircle size={18} className="text-green-400" />
                      ) : (
                        <AlertTriangle size={18} className="text-red-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Programming summary when no detailed cases */}
        {problem.type === 'programming' && details && (!details.cases || details.cases.length === 0) && (
          <div className="space-y-2">
            <p className="text-gray-300">
              通过：<span className="text-green-400">{details.passed ?? 0}</span> / {details.total ?? 0}
            </p>
          </div>
        )}

        {/* Choice results */}
        {problem.type === 'choice' && details && (
          <div className="space-y-2">
            <p className="text-gray-300">
              你的选择：{' '}
              <span className="text-white">
                {(details.options ?? problem.options)?.[Number(details.user_answer)] ?? '未知'}
              </span>
            </p>
            <p className="text-gray-300">
              正确答案：{' '}
              <span className="text-green-400">
                {(details.options ?? problem.options)?.[Number(details.correct_answer)] ?? '未知'}
              </span>
            </p>
            {submissionResult.status === 'accepted' ? (
              <p className="text-green-400 flex items-center gap-1">
                <CheckCircle size={16} /> 回答正确
              </p>
            ) : (
              <p className="text-red-400 flex items-center gap-1">
                <AlertTriangle size={16} /> 回答错误
              </p>
            )}
          </div>
        )}

        {/* Fill blank results */}
        {problem.type === 'fill_blank' && details && (
          <div className="space-y-2">
            <p className="text-gray-300">
              你的答案：{' '}
              <span className="text-white">
                {String(details.user_answer ?? '')}
              </span>
            </p>
            <p className="text-gray-300">
              可接受答案：{' '}
              {(details.acceptable_answers ?? problem.blanks_answer)?.map((ans: string, i: number) => (
                <span key={i} className="text-green-400 mr-2">
                  {ans}
                </span>
              ))}
            </p>
            {details.reference && (
              <p className="text-gray-300">
                参考解析：{' '}
                <span className="text-gray-400">{details.reference}</span>
              </p>
            )}
            {submissionResult.status === 'accepted' ? (
              <p className="text-green-400 flex items-center gap-1">
                <CheckCircle size={16} /> 回答正确
              </p>
            ) : (
              <p className="text-red-400 flex items-center gap-1">
                <AlertTriangle size={16} /> 回答错误
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const tagList = problem?.tags
    ? problem.tags.split(',').filter(Boolean)
    : [];

  return (
    <div>
      <Link
        to="/problems"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        返回题库
      </Link>

      {loading ? (
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-7 bg-dark-700 rounded w-1/2" />
          <div className="h-4 bg-dark-700 rounded w-1/4" />
          <div className="h-4 bg-dark-700 rounded w-3/4" />
          <div className="h-4 bg-dark-700 rounded w-2/3" />
          <div className="h-4 bg-dark-700 rounded w-1/2" />
          <div className="h-40 bg-dark-700 rounded" />
        </div>
      ) : notFound ? (
        <div className="card p-10 text-center">
          <AlertTriangle size={40} className="mx-auto text-yellow-400 mb-3" />
          <p className="text-gray-300 mb-4">题目不存在</p>
          <Link to="/problems" className="btn-primary">
            返回题库
          </Link>
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchProblem} className="btn-primary">
            重试
          </button>
        </div>
      ) : problem ? (
        <>
          {/* Problem header */}
          <div className="card p-6 mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-white">
                {problem.title}
              </h1>
              {problem.user_passed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/40">
                  <CheckCircle size={14} />
                  已通过
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`px-2 py-0.5 rounded text-xs text-white ${
                  DIFFICULTY_COLORS[problem.difficulty] || 'bg-gray-600'
                }`}
              >
                {DIFFICULTY_LABELS[problem.difficulty] || problem.difficulty}
              </span>
              <span className="px-2 py-0.5 bg-blue-600 rounded text-xs text-white">
                {TYPE_LABELS[problem.type] || problem.type}
              </span>
            </div>

            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tagList.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-dark-800 text-gray-400 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              题目描述
            </h2>
            <MarkdownRenderer content={problem.description} />
          </div>

          {/* Submission area */}
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              提交答案
            </h2>

            {problem.type === 'programming' && (
              <>
                <div className="flex gap-2 mb-3">
                  {(['javascript', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                        language === lang
                          ? 'bg-blue-600 text-white'
                          : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      {lang === 'javascript' ? 'JavaScript' : 'Python'}
                    </button>
                  ))}
                </div>
                <CodeEditor
                  code={code}
                  language={language === 'javascript' ? 'javascript' : 'python'}
                  onChange={setCode}
                />
              </>
            )}

            {problem.type === 'choice' && problem.options && (
              <ChoiceQuestion
                options={problem.options}
                selectedAnswer={selectedAnswer}
                onSelect={setSelectedAnswer}
              />
            )}

            {problem.type === 'fill_blank' && (
              <FillBlankQuestion
                answer={fillAnswer}
                onChange={setFillAnswer}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Play size={18} />
                  提交
                </>
              )}
            </button>
          </div>

          {/* Result panel */}
          {renderResultPanel()}
        </>
      ) : null}
    </div>
  );
}
