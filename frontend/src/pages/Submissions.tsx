import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  RefreshCw,
  Inbox,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
  Code,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import SubmissionStatus from '../components/SubmissionStatus';
import type { Submission as SubmissionType, PaginatedResponse } from '../types';

const STATUS_FILTERS = [
  { label: '全部', value: '' },
  { label: '通过', value: 'accepted' },
  { label: '答案错误', value: 'wrong_answer' },
  { label: '运行错误', value: 'runtime_error' },
  { label: '超时', value: 'time_limit_exceeded' },
];

const PAGE_SIZE = 15;

export default function Submissions() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<SubmissionType> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: PAGE_SIZE,
      };
      if (statusFilter) params.status = statusFilter;
      const res = await api.submissions.list(params);
      setData(res);
    } catch (err: any) {
      const msg = err.message || '加载提交记录失败';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (page > 4) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const submissions = data?.submissions ?? [];

  const totalSubmissions = data?.total ?? 0;
  const acceptedCount = submissions.filter(s => s.status === 'accepted').length;
  const acceptanceRate = submissions.length > 0
    ? ((acceptedCount / submissions.length) * 100).toFixed(1)
    : '0';

  const langCounts: Record<string, number> = {};
  submissions.forEach(s => {
    if (s.language) {
      langCounts[s.language] = (langCounts[s.language] || 0) + 1;
    }
  });
  let mostUsedLang = '-';
  let maxLangCount = 0;
  Object.entries(langCounts).forEach(([lang, count]) => {
    if (count > maxLangCount) {
      maxLangCount = count;
      mostUsedLang = lang;
    }
  });

  const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
  const avgScore = submissions.length > 0 ? (totalScore / submissions.length).toFixed(1) : '0';

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">提交记录</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1 mb-6">
        {STATUS_FILTERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              statusFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-3">
            <Send size={20} className="text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">总提交</p>
              <p className="text-lg font-bold text-white">{totalSubmissions}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <div>
              <p className="text-xs text-gray-400">通过率</p>
              <p className="text-lg font-bold text-white">{acceptanceRate}%</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Code size={20} className="text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">常用语言</p>
              <p className="text-lg font-bold text-white">{mostUsedLang}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Award size={20} className="text-yellow-400" />
            <div>
              <p className="text-xs text-gray-400">平均分</p>
              <p className="text-lg font-bold text-white">{avgScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-dark-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchSubmissions}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card p-10 text-center">
          <Inbox size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">暂无提交记录</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-gray-400">题目</th>
                  <th className="text-left py-3 px-4 text-gray-400">状态</th>
                  <th className="text-left py-3 px-4 text-gray-400">分数</th>
                  <th className="text-left py-3 px-4 text-gray-400">语言</th>
                  <th className="text-left py-3 px-4 text-gray-400">
                    提交时间
                  </th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="py-2 px-4" colSpan={6}>
                      <div
                        onClick={() => toggleExpand(Number(submission.id))}
                        className="cursor-pointer"
                      >
                        <div className="grid grid-cols-6 items-center py-2 hover:bg-dark-800/50 rounded transition-colors">
                          <div className="px-4 text-white font-medium truncate">
                            {submission.problem_title ??
                              `#${submission.problem_id}`}
                          </div>
                          <div className="px-4">
                            <SubmissionStatus
                              status={submission.status}
                              score={submission.score}
                            />
                          </div>
                          <div className="px-4 text-gray-300">
                            {submission.score}
                          </div>
                          <div className="px-4 text-gray-400">
                            {submission.language || '-'}
                          </div>
                          <div className="px-4 text-gray-400 flex items-center gap-1">
                            <Clock size={14} />
                            {formatTime(submission.created_at)}
                          </div>
                          <div className="px-4 text-right text-gray-400">
                            {expandedId === Number(submission.id) ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </div>

                        {expandedId === Number(submission.id) && (
                          <div className="px-4 pb-4 mt-2 border-t border-dark-700 pt-3">
                            {submission.code && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  提交代码
                                </p>
                                <pre className="bg-dark-900 rounded p-3 text-sm text-gray-300 overflow-auto max-h-60">
                                  {submission.code}
                                </pre>
                              </div>
                            )}

                            {submission.details?.error && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  错误信息
                                </p>
                                <pre className="bg-dark-900 rounded p-3 text-sm text-red-400 overflow-auto max-h-40">
                                  {submission.details.error}
                                </pre>
                              </div>
                            )}

                            {(submission.time_ms != null ||
                              submission.memory_kb != null) && (
                              <div className="mb-3 flex flex-wrap items-center gap-4">
                                {submission.time_ms != null && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">耗时</span>
                                    <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${Math.min((submission.time_ms / 2000) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-300 font-mono">{submission.time_ms}ms</span>
                                  </div>
                                )}
                                {submission.memory_kb != null && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">内存</span>
                                    <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${Math.min((submission.memory_kb / 65536) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-300 font-mono">
                                      {(submission.memory_kb / 1024).toFixed(1)}MB
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {submission.details?.cases &&
                              submission.details.cases.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    测试用例结果
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {submission.details.cases.map(
                                      (result, idx) => (
                                        <span
                                          key={idx}
                                          className={`px-2 py-1 rounded text-xs ${
                                            result.passed
                                              ? 'bg-green-600/20 text-green-400'
                                              : 'bg-red-600/20 text-red-400'
                                          }`}
                                        >
                                          #{result.case}{' '}
                                          {result.passed ? '通过' : '未通过'}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {submission.details?.options &&
                              submission.details?.user_answer !== undefined &&
                              submission.details?.user_answer !== null && (
                                <div className="mb-1">
                                  <p className="text-xs text-gray-500 mb-1">选择答案</p>
                                  <div className="flex flex-wrap gap-2">
                                    {submission.details.options.map(
                                      (opt, idx) => {
                                        const isUser = idx === Number(submission.details!.user_answer);
                                        const isCorrect =
                                          String(idx) === String(submission.details!.correct_answer);
                                        return (
                                          <span
                                            key={idx}
                                            className={`px-2 py-1 rounded text-xs border ${
                                              isUser && isCorrect
                                                ? 'bg-green-600/20 text-green-400 border-green-600/40'
                                                : isUser
                                                  ? 'bg-red-600/20 text-red-400 border-red-600/40'
                                                  : isCorrect
                                                    ? 'bg-green-600/10 text-green-500 border-green-600/20'
                                                    : 'bg-dark-700 text-gray-400 border-dark-600'
                                            }`}
                                          >
                                            {String.fromCharCode(65 + idx)}. {opt}
                                            {isUser && ' ← 你的选择'}
                                            {isCorrect && ' ✓'}
                                          </span>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}

                            {submission.details?.acceptable_answers &&
                              submission.details?.user_answer !== undefined &&
                              submission.details?.user_answer !== null && (
                                <div className="mb-1">
                                  <p className="text-xs text-gray-500 mb-1">填空答案</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      submission.details.acceptable_answers.includes(
                                        String(submission.details.user_answer)
                                      )
                                        ? 'bg-green-600/20 text-green-400'
                                        : 'bg-red-600/20 text-red-400'
                                    }`}>
                                      你的答案：{submission.details.user_answer}
                                    </span>
                                    <span className="text-dark-500 text-xs">正确选项：{submission.details.acceptable_answers.join(' / ')}</span>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span
                    key={`dots-${i}`}
                    className="px-3 py-1 text-gray-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-md text-sm transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
