import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Inbox,
  BookOpen,
  Code,
  ListChecks,
  PenLine,
  ArrowRightLeft,
  Tag,
  Star,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProblemCard from '../components/ProblemCard';
import type { Problem, PaginatedResponse, ProblemStats } from '../types';
import { useBookmarks } from '../context/BookmarkContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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

const sortOptions = [
  { label: '默认排序', value: '' },
  { label: '通过率最高', value: 'acceptance' },
  { label: '提交最多', value: 'submissions' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function Problems() {
  useDocumentTitle('题库');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [data, setData] = useState<PaginatedResponse<Problem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);

  const [searchInput, setSearchInput] = useState(search);
  const [pageSize, setPageSize] = useState(12);
  const [jumpPage, setJumpPage] = useState('');
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const { isBookmarked } = useBookmarks();

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.problems.stats();
      setStats(res);
    } catch {
      // silently ignore stats errors
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.problems.getTags();
      setTags(res.tags);
    } catch {
      // silently ignore tags errors
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTags();
  }, [fetchStats, fetchTags]);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (type) params.type = type;
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;
      if (sort) params.sort = sort;

      const res = await api.problems.list(params);
      setData(res);
    } catch (err: any) {
      const msg = err.message || '加载题目列表失败';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, type, difficulty, search, sort]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounced search: triggers 300ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput, page: '' });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

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

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    updateParams({ page: '' });
  };

  const handleJumpPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(jumpPage, 10);
      if (num >= 1 && num <= totalPages) {
        updateParams({ page: String(num) });
        setJumpPage('');
      }
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

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

  const statCards = [
    { label: '全部', value: stats?.total ?? 0, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: '编程题', value: stats?.programming ?? 0, icon: Code, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: '选择题', value: stats?.choice ?? 0, icon: ListChecks, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: '填空题', value: stats?.fill_blank ?? 0, icon: PenLine, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">题库</h1>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-3 p-3 rounded-lg border ${card.border} ${card.bg}`}
          >
            <card.icon size={20} className={card.color} />
            <div>
              <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-400">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

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

      {/* Tags Cloud */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Tag size={14} className="text-gray-500 shrink-0" />
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => updateParams({ search: tag.name, page: '' })}
              className={`px-2.5 py-0.5 rounded-md text-xs transition-colors ${
                search === tag.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {tag.name}
              <span className="ml-1 text-[10px] opacity-60">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filters & Page Size */}
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

        <button
          onClick={() => setBookmarkFilter(!bookmarkFilter)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
            bookmarkFilter
              ? 'bg-yellow-600 text-white'
              : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
          }`}
        >
          <Star size={14} className={bookmarkFilter ? 'fill-white' : ''} />
          仅显示收藏
        </button>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-gray-500" />
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams({ sort: opt.value, page: '' })}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                sort === opt.value || (!sort && opt.value === '')
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowRightLeft size={14} className="text-gray-500" />
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                pageSize === size
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {size}
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
          <Inbox size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-300 text-lg font-medium mb-2">暂无题目</p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            {search || type || difficulty
              ? '没有找到匹配的题目，试试调整筛选条件或搜索关键词'
              : '题库中还没有题目，管理员添加题目后将在这里展示'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {(bookmarkFilter
              ? data?.problems?.filter((p) => isBookmarked(p.id))
              : data?.problems
            )?.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 flex-wrap">
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

              {/* Jump to page */}
              <span className="text-xs text-gray-500 mx-2">跳至</span>
              <input
                type="text"
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleJumpPage}
                placeholder={`1-${totalPages}`}
                className="w-14 h-9 text-center text-sm bg-dark-800 border border-dark-700 rounded-md text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-gray-500">页</span>
            </div>
          )}

          {/* Show simple pagination info when only one page */}
          {totalPages <= 1 && data && data.problems && data.problems.length > 0 && (
            <div className="flex items-center justify-center mt-2">
              <span className="text-sm text-gray-500">
                共 {data.total} 道题目
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
