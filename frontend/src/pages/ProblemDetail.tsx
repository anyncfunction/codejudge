import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Share2,
  Star,
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Zap,
  Terminal,
  Clipboard,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import CodeEditor from '../components/CodeEditor';
import ChoiceQuestion from '../components/ChoiceQuestion';
import FillBlankQuestion from '../components/FillBlankQuestion';
import SubmissionStatus from '../components/SubmissionStatus';
import MarkdownRenderer from '../components/MarkdownRenderer';
import type { Problem, Submission, TestCaseResult } from '../types';
import { formatTimeAgo } from '../utils';
import { useBookmarks } from '../context/BookmarkContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const navigateToProblem = useCallback((newId: number) => {
    if (newId >= 1) navigate(`/problems/${newId}`);
  }, [navigate]);

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

  // Hint panel
  const [hintExpanded, setHintExpanded] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [showCustomTest, setShowCustomTest] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState<{stdout?: string; stderr?: string; time?: number} | null>(null);
  const [customRunning, setCustomRunning] = useState(false);
  const [similarProblems, setSimilarProblems] = useState<Problem[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recentSubs, setRecentSubs] = useState<Submission[]>([]);
  const [sampleCaseIndex, setSampleCaseIndex] = useState(0);
  const [saved, setSaved] = useState(true);

  const CODE_SAVE_KEY = `cj_code_${id}_${language}`;

  const fetchProblem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const problem = await api.problems.get(Number(id));
      setProblem(problem);
      window.scrollTo(0, 0);
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
    const savedKey = `cj_code_${id}_${lang}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      setCode(saved);
      return;
    }
    try {
      const { template } = await api.problems.getTemplate(lang);
      setCode(template);
    } catch {
      setCode('');
    }
  }, [id]);

  useEffect(() => {
    fetchProblem();
    setSubmissionResult(null);
    setSelectedAnswer(null);
    setFillAnswer('');
    setSampleCaseIndex(0);
  }, [fetchProblem]);

  useEffect(() => {
    if (problem?.type === 'programming') {
      loadTemplate(language);
    }
  }, [problem?.type, language, loadTemplate]);

  useEffect(() => {
    if (problem?.tags) {
      api.problems.getSimilar(problem.id, problem.tags).then(setSimilarProblems).catch(() => setSimilarProblems([]));
    } else {
      setSimilarProblems([]);
    }
  }, [problem?.id, problem?.tags]);

  useEffect(() => {
    if (problem?.id) {
      api.submissions.list({ problem_id: problem.id, limit: 3 }).then(res => setRecentSubs(res.submissions || [])).catch(() => {});
    }
  }, [problem?.id]);

  useEffect(() => {
    if (!code || problem?.type !== 'programming') return;
    setSaved(false);
    const timer = setTimeout(() => {
      localStorage.setItem(CODE_SAVE_KEY, code);
      setSaved(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [code, CODE_SAVE_KEY, problem?.type]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!saved && problem?.type === 'programming' && code) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saved, code, problem?.type]);

  const handleCustomRun = async () => {
    setCustomRunning(true);
    setCustomOutput(null);
    try {
      const token = localStorage.getItem('oj_token');
      const res = await fetch('/api/problems/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, language, input: customInput }),
      });
      const data = await res.json();
      setCustomOutput(data);
    } catch {
      setCustomOutput({ stderr: '运行失败' });
    } finally {
      setCustomRunning(false);
    }
  };

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
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setShowConfirm(false);
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  const renderResultPanel = () => {
    if (!submissionResult || !problem) return null;

    const details = submissionResult.details;

    return (
      <div className="card p-6 mt-6 relative overflow-hidden">
        {submissionResult.status === 'accepted' && (
          <>
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-float-up"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    bottom: '-10px',
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5],
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 relative z-10">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-semibold text-lg">🎉 恭喜通过！</p>
                <p className="text-emerald-500/70 text-sm">太棒了，继续加油！</p>
              </div>
            </div>
          </>
        )}
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

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => { setSubmissionResult(null); window.scrollTo(0, 0); }}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors inline-flex items-center gap-1"
          >
            <RefreshCw size={14} /> 再来一次
          </button>
          <Link
            to={`/submissions?problem_id=${problem.id}`}
            className="text-sm text-dark-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <Send size={14} /> 查看全部提交
          </Link>
        </div>
      </div>
    );
  };

  const tagList = problem?.tags
    ? problem.tags.split(',').filter(Boolean)
    : [];

  useDocumentTitle(problem?.title || '题目');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/problems" className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          返回题库
        </Link>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => navigateToProblem(Number(id) - 1)}
            disabled={!id || Number(id) <= 1}
            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="上一题"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => navigateToProblem(Number(id) + 1)}
            disabled={!id}
            className="p-1.5 rounded-md text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="下一题"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

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
              <button
                onClick={() => toggleBookmark(problem.id)}
                className="p-1 rounded-md hover:bg-dark-700 transition-colors"
                title={isBookmarked(problem.id) ? '取消收藏' : '收藏'}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isBookmarked(problem.id)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-dark-500 hover:text-yellow-400'
                  }`}
                />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('链接已复制');
                }}
                className="p-1 rounded-md hover:bg-dark-700 transition-colors"
                title="链接"
              >
                <Share2 className="w-5 h-5 text-dark-500 hover:text-white transition-colors" />
              </button>
              <button
                onClick={() => {
                  const text = `[${problem.title}](${window.location.href})\n\n${problem.description}`;
                  navigator.clipboard.writeText(text);
                  toast.success('题目信息已复制');
                }}
                className="p-1 rounded-md hover:bg-dark-700 transition-colors"
                title="复制题目"
              >
                <Clipboard className="w-5 h-5 text-dark-500 hover:text-white transition-colors" />
              </button>
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
              <span className="text-xs text-dark-400 flex items-center gap-3">
                <span title="提交次数"><Zap size={12} className="inline" /> {problem.submission_count ?? 0}</span>
                <span title="通过次数"><CheckCircle size={12} className="inline text-green-400" /> {problem.accepted_count ?? 0}</span>
                <span title="浏览"><Eye size={12} className="inline" /> {problem.view_count ?? 0}</span>
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

          {/* Solution */}
          {problem.user_passed && problem.solution && (
            <div className="card p-6 mb-6 border-primary-500/20">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Eye size={16} />
                {showSolution ? '隐藏参考答案' : '查看参考答案'}
              </button>
              {showSolution && (
                <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                  <MarkdownRenderer content={problem.solution} />
                </div>
              )}
            </div>
          )}

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
                  <span className={`ml-auto text-[10px] self-center transition-opacity ${saved ? 'text-emerald-500/70' : 'text-yellow-500/70 opacity-0'}`}>
                    {saved ? '已保存' : '保存中...'}
                  </span>
                </div>

                {/* Hint panel */}
                <div className="mb-3 border border-dark-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setHintExpanded(!hintExpanded)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-dark-800/70 text-left hover:bg-dark-800 transition-colors"
                  >
                    <Lightbulb size={16} className="text-yellow-400" />
                    <span className="text-sm text-gray-300">输入/输出格式提示</span>
                    <span className="ml-auto text-gray-500">
                      {hintExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {hintExpanded && (
                    <div className="px-3 py-2 space-y-1 text-xs text-dark-400">
                      <p>输入通过标准输入(stdin)读取</p>
                      <p>使用 console.log() (JS) 或 print() (Python) 输出</p>
                      <p>示例代码模板已自动填入</p>
                    </div>
                  )}
                </div>

                {/* Sample test case */}
                {problem.test_cases && problem.test_cases.length > 0 && (
                  <div className="mb-3 p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                    {problem.test_cases.length > 1 && (
                      <div className="flex gap-1 mb-3">
                        {problem.test_cases.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSampleCaseIndex(i)}
                            className={`px-2 py-0.5 rounded text-xs transition-colors ${sampleCaseIndex === i ? 'bg-dark-600 text-white' : 'bg-dark-700/50 text-dark-400 hover:text-white'}`}
                          >
                            示例 {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-dark-400 text-xs mb-2">示例输入:</p>
                    <div className="relative">
                      <pre className="text-dark-300 text-sm bg-dark-900/50 rounded p-2">{problem.test_cases[sampleCaseIndex].input}</pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(problem.test_cases[sampleCaseIndex].input);
                          toast.success('输入已复制');
                        }}
                        className="absolute top-1 right-1 p-1 rounded text-dark-500 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Clipboard size={12} />
                      </button>
                    </div>
                    <p className="text-dark-400 text-xs mb-1 mt-2">示例输出:</p>
                    <div className="relative">
                      <pre className="text-emerald-400 text-sm bg-dark-900/50 rounded p-2">{problem.test_cases[sampleCaseIndex].expected_output}</pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(problem.test_cases[sampleCaseIndex].expected_output);
                          toast.success('输出已复制');
                        }}
                        className="absolute top-1 right-1 p-1 rounded text-dark-500 hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        <Clipboard size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom test */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowCustomTest(!showCustomTest)}
                    className="flex items-center gap-1 text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    <Terminal size={12} />
                    {showCustomTest ? '收起自定义测试' : '自定义测试'}
                  </button>
                  {showCustomTest && (
                    <div className="mt-2 bg-dark-800/50 rounded-lg border border-dark-700 p-3">
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="输入测试数据..."
                        rows={3}
                        className="input w-full font-mono text-sm mb-2 resize-y"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={handleCustomRun} disabled={customRunning} className="btn-secondary text-xs inline-flex items-center gap-1">
                          {customRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          运行
                        </button>
                        <span className="text-xs text-dark-500">按实际运行，不计入提交记录</span>
                      </div>
                      {customOutput !== null && (
                        <div className="mt-2">
                          <pre className={`text-sm font-mono p-2 rounded ${customOutput.stderr ? 'bg-red-600/10 text-red-400' : 'bg-dark-900 text-green-400'} overflow-auto max-h-32`}>
                            {customOutput.stdout || customOutput.stderr || '(空输出)'}
                          </pre>
                          {customOutput.time != null && (
                            <p className="text-xs text-dark-500 mt-1">耗时: {customOutput.time}ms</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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

            <div className="flex items-center gap-3 mt-4">
              {showConfirm && (
                <div className="flex items-center gap-2 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2">
                  <span className="text-sm text-dark-200">确认提交？</span>
                  <button onClick={() => { setShowConfirm(false); handleSubmit(); }} className="btn-primary text-xs px-3 py-1">确认</button>
                  <button onClick={() => setShowConfirm(false)} className="btn-secondary text-xs px-3 py-1">取消</button>
                </div>
              )}
              {!showConfirm && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2"
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
              )}
              <span className="text-xs text-dark-400">Ctrl+Enter 快速提交</span>
            </div>
            </div>

            {/* Similar problems */}
            {similarProblems !== null && similarProblems.length > 0 && (
              <div className="card p-4 mt-4">
                <h3 className="text-sm font-semibold text-dark-200 mb-3">相似题目</h3>
                <div className="flex flex-wrap gap-2">
                  {similarProblems.map(p => (
                    <Link
                      key={p.id}
                      to={`/problems/${p.id}`}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        DIFFICULTY_COLORS[p.difficulty]
                          ? `bg-${DIFFICULTY_COLORS[p.difficulty]}/10 border-${DIFFICULTY_COLORS[p.difficulty]}/30`
                          : 'bg-dark-700 border-dark-600'
                      } hover:opacity-80`}
                    >
                      #{p.id} {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent submissions */}
            {recentSubs.length > 0 && (
              <div className="card p-4 mt-4">
                <h3 className="text-sm font-semibold text-dark-200 mb-3">我的提交记录</h3>
                <div className="space-y-1.5">
                  {recentSubs.map(s => (
                    <Link key={s.id} to={`/submissions`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors text-xs">
                      <SubmissionStatus status={s.status} score={s.score} />
                      <span className="text-dark-400">{formatTimeAgo(s.created_at)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {/* Result panel */}
          {renderResultPanel()}
        </>
      ) : null}
    </div>
  );
}
