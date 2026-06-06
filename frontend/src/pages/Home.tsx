import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ListChecks, PenLine, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProblemCard from '../components/ProblemCard';
import type { ProblemStats, Problem } from '../types';

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setCount(0);
      return;
    }
    const duration = 1200;
    const step = target / (duration / 30);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count}</>;
}

const statDefs = [
  { icon: BookOpen, label: '题库总数', key: 'total' as const, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Code2, label: '编程题', key: 'programming' as const, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: ListChecks, label: '选择题', key: 'choice' as const, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: PenLine, label: '填空题', key: 'fill_blank' as const, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);

  useEffect(() => {
    api.problems.stats().then(setStats).catch(() => {});
    api.problems
      .list({ limit: 6, page: 1 })
      .then((res) => {
        if (res.problems) setRecentProblems(res.problems);
      })
      .catch(() => {});
  }, []);

  const tagCounts: Record<string, number> = {};
  recentProblems.forEach((p) => {
    if (p.tags) {
      p.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    }
  });
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="pt-12 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
          CodeJudge
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
          面向编程、选择题与填空的在线评测平台
        </p>

        {user && (
          <p className="mt-4 text-green-400 text-sm">
            欢迎回来，{user.username}
          </p>
        )}

        <Link
          to="/problems"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          开始刷题
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Stats Dashboard */}
      <section className="pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statDefs.map(({ icon: Icon, label, key, color, bg }) => (
            <div key={label} className="card p-6 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bg} mb-3`}>
                <Icon size={24} className={color} />
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">
                {stats === null ? '...' : <AnimatedNumber target={stats[key]} />}
              </p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Problems */}
      {recentProblems.length > 0 && (
        <section className="pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">最新题目</h2>
            <Link
              to="/problems"
              className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 transition-colors"
            >
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProblems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <section className="pb-16">
          <h2 className="text-xl font-bold text-white mb-6">热门标签</h2>
          <div className="flex flex-wrap gap-3">
            {popularTags.map(([tag, count]) => (
              <Link
                key={tag}
                to={`/problems?search=${encodeURIComponent(tag)}`}
                className="px-4 py-2 rounded-lg bg-dark-800/80 border border-dark-700 text-dark-200 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-200"
              >
                {tag}
                <span className="ml-2 text-xs text-dark-500">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
