import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ListChecks, PenLine, ArrowRight, BookOpen, Sparkles, Zap, Flame, Calendar } from 'lucide-react';
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
  const [daily, setDaily] = useState<{ problem: Problem; date: string } | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  useEffect(() => {
    api.problems.stats().then(setStats).catch(() => {});
    api.problems
      .list({ limit: 6, page: 1 })
      .then((res) => {
        if (res.problems) setRecentProblems(res.problems);
      })
      .catch(() => {});
    api.problems
      .getDaily()
      .then((res) => {
        if (res.problem) setDaily(res);
      })
      .catch(() => {})
      .finally(() => setDailyLoading(false));
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

      {/* Daily Challenge */}
      {daily && (
        <section className="pb-16">
          <Link
            to={`/problems/${daily.problem.id}`}
            className="card p-6 group hover:border-primary-500/40 transition-all duration-200 relative overflow-hidden block"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full" />
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-500/10">
                <Calendar size={20} className="text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{daily.date}</p>
                <h2 className="text-lg font-bold text-white">每日一题</h2>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors mb-3">
              {daily.problem.title}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {daily.problem.type === 'programming' ? '编程' : daily.problem.type === 'choice' ? '选择' : '填空'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
                  daily.problem.difficulty === 'easy'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : daily.problem.difficulty === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {daily.problem.difficulty === 'easy' ? '简单' : daily.problem.difficulty === 'medium' ? '中等' : '困难'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-primary-400 group-hover:text-primary-300 transition-colors">
              去挑战 <ArrowRight size={14} />
            </span>
          </Link>
        </section>
      )}

      {/* Daily Loading */}
      {dailyLoading && !daily && (
        <section className="pb-16">
          <div className="card p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-dark-700" />
              <div>
                <div className="h-3 w-20 bg-dark-700 rounded mb-2" />
                <div className="h-5 w-24 bg-dark-700 rounded" />
              </div>
            </div>
            <div className="h-6 w-3/4 bg-dark-700 rounded mb-3" />
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-12 bg-dark-700 rounded" />
              <div className="h-5 w-12 bg-dark-700 rounded" />
            </div>
            <div className="h-4 w-16 bg-dark-700 rounded" />
          </div>
        </section>
      )}

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

      {/* Difficulty CTA */}
      <section className="pb-16">
        <h2 className="text-xl font-bold text-white mb-6">按难度刷题</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/problems?difficulty=easy"
            className="card p-6 group hover:border-emerald-500/40 transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 mb-3">
              <Sparkles size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-400 group-hover:text-emerald-300">从简单开始</h3>
            <p className="text-gray-500 text-sm mt-1">适合新手入门，巩固基础</p>
          </Link>
          <Link
            to="/problems?difficulty=medium"
            className="card p-6 group hover:border-amber-500/40 transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 mb-3">
              <Zap size={24} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-amber-400 group-hover:text-amber-300">挑战中等</h3>
            <p className="text-gray-500 text-sm mt-1">提升算法思维，突破瓶颈</p>
          </Link>
          <Link
            to="/problems?difficulty=hard"
            className="card p-6 group hover:border-red-500/40 transition-all duration-200"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 mb-3">
              <Flame size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-400 group-hover:text-red-300">勇闯困难</h3>
            <p className="text-gray-500 text-sm mt-1">攻克高阶难题，冲刺面试</p>
          </Link>
        </div>
      </section>
    </>
  );
}
