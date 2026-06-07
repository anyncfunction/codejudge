import { Link } from 'react-router-dom';
import { Code2, ListChecks, PenLine, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import type { Problem } from '../types';

const typeConfig: Record<Problem['type'], { label: string; icon: React.ReactNode; className: string }> = {
  programming: {
    label: '编程',
    icon: <Code2 className="w-3.5 h-3.5" />,
    className: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
  },
  choice: {
    label: '选择',
    icon: <ListChecks className="w-3.5 h-3.5" />,
    className: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
  fill_blank: {
    label: '填空',
    icon: <PenLine className="w-3.5 h-3.5" />,
    className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
};

const difficultyClass: Record<Problem['difficulty'], string> = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
};

const difficultyLabel: Record<Problem['difficulty'], string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export default function ProblemCard({ problem }: { problem: Problem }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(problem.id);
  const typeCfg = typeConfig[problem.type];
  const tags = problem.tags ? problem.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const ratio = problem.submission_count > 0
    ? Math.round((problem.accepted_count / problem.submission_count) * 100)
    : 0;
  const userStatus = problem.user_status || (problem.user_passed ? 'accepted' : null);

  return (
    <Link
      to={`/problems/${problem.id}`}
      className={`card flex flex-col gap-4 hover:border-primary-500/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-150 group${userStatus === 'accepted' ? ' border-l-emerald-500' : userStatus === 'attempted' ? ' border-l-yellow-500' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {userStatus === 'accepted' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full border border-emerald-500/30 flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              已通过
            </span>
          )}
          {userStatus === 'attempted' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/15 text-yellow-400 text-xs rounded-full border border-yellow-500/30 flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
              已尝试
            </span>
          )}
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
            <span className="text-dark-500 font-mono text-sm mr-1.5">#{problem.id}</span>
            {problem.title}
          </h3>
        </div>
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(problem.id); }}
            className="p-1 rounded-md hover:bg-dark-700 transition-colors flex-shrink-0"
            title={bookmarked ? '取消收藏' : '收藏'}
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                bookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-dark-500 hover:text-yellow-400'
              }`}
            />
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge ${typeCfg.className} gap-1`}>
            {typeCfg.icon}
            {typeCfg.label}
          </span>
          <span className={difficultyClass[problem.difficulty]}>
            {difficultyLabel[problem.difficulty]}
          </span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => { e.preventDefault(); window.location.href = `/problems?search=${encodeURIComponent(tag)}`; }}
              className="px-2 py-0.5 rounded-md text-xs bg-dark-700/50 text-dark-400 border border-dark-600/50 cursor-pointer hover:bg-dark-700 hover:text-dark-200 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <span className="text-xs text-dark-400 whitespace-nowrap">
          {problem.accepted_count}/{problem.submission_count} · {ratio}%
          {problem.view_count != null && (
            <span className="ml-2 text-dark-500">· 👁 {problem.view_count}</span>
          )}
        </span>
      </div>
    </Link>
  );
}
