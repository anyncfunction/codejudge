import { Link } from 'react-router-dom';
import { Code2, ListChecks, PenLine, CheckCircle2, Star } from 'lucide-react';
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

  return (
    <Link
      to={`/problems/${problem.id}`}
      className="card flex flex-col gap-4 hover:border-primary-500/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {problem.user_passed && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          )}
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
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
              className="px-2 py-0.5 rounded-md text-xs bg-dark-700/50 text-dark-400 border border-dark-600/50"
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
        </span>
      </div>
    </Link>
  );
}
