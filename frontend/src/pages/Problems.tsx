import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProblemCard from '../components/ProblemCard';
import type { Problem, PaginatedResponse } from '../types';

const typeOptions = [
  { label: '全部', value: '' },
  { label: '编程题', value: 'programming' },
  { label: '选择题', value: 'choice' },
  { label: '填空题', value: 'fill_blank' },
];

const difficultyOptions = [
  { label: '全部', value: '' },
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

const PAGE_SIZE = 12;

export default function Problems() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [data, setData] = useState<PaginatedResponse<Problem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(search);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: PAGE_SIZE,
      };
      if (type) params.type = type;
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;

      const res = await api.problems.list(params);
      setData(res);
    } catch (err: any) {
      const msg = err.message || '加载题目列表失败';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, type, difficulty, search]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    if (!updates.page) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearch = () => {
    updateParams({ search: searchInput, page: '' });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">题库</h1>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索题目..."
            className="input pl-10 w-full"
          />
        </div>
        <button onClick={handleSearch} className="btn-primary px-4">
          搜索
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams({ type: opt.value, page: '' })}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                type === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateParams({ difficulty: opt.value, page: '' })
              }
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                difficulty === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="card p-5 animate-pulse space-y-3"
            >
              <div className="h-5 bg-dark-700 rounded w-2/3" />
              <div className="h-4 bg-dark-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProblems}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      ) : data && data.problems && data.problems.length === 0 ? (
        <div className="card p-10 text-center">
          <Inbox size={40} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">暂无题目</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {data?.problems?.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() =>
                  updateParams({ page: String(page - 1) })
                }
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
                    onClick={() =>
                      updateParams({ page: String(p) })
                    }
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
                onClick={() =>
                  updateParams({ page: String(page + 1) })
                }
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
