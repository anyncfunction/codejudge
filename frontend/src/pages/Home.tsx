import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, ListChecks, PenLine, ArrowRight, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { ProblemStats } from '../types';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProblemStats | null>(null);

  useEffect(() => {
    api.problems
      .stats()
      .then((res) => setStats(res))
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="pt-24 pb-16 text-center px-4">
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

      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4 pb-16">
        <div className="card p-6 text-center">
          <Code2 size={36} className="mx-auto text-blue-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">编程题</h3>
          <p className="text-gray-400 text-sm">
            在线编写代码，支持多语言实时评测
          </p>
        </div>

        <div className="card p-6 text-center">
          <ListChecks size={36} className="mx-auto text-green-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">选择题</h3>
          <p className="text-gray-400 text-sm">
            选择正确答案，即时反馈判题结果
          </p>
        </div>

        <div className="card p-6 text-center">
          <PenLine size={36} className="mx-auto text-purple-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">填空题</h3>
          <p className="text-gray-400 text-sm">
            填写答案，精准匹配评分
          </p>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 pb-24 text-center">
        <div className="card p-8">
          <Terminal size={32} className="mx-auto text-cyan-400 mb-3" />
          <p className="text-3xl font-bold text-white">
            {stats !== null ? stats.total : '...'}
          </p>
          <p className="text-gray-400 mt-1">题库总数</p>
        </div>
      </section>
    </>
  );
}
