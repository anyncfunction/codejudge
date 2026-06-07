import { useState, useEffect } from 'react';
import { Trophy, Medal, User as UserIcon, Zap, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

interface LeaderboardEntry {
  rank: number;
  username: string;
  id: number;
  solved: number;
  accepted: number;
  total_submissions: number;
}

export default function Leaderboard() {
  useDocumentTitle('排行榜');
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.auth.leaderboard()
      .then(data => { setEntries(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="w-6 h-6 text-amber-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-dark-400 font-mono text-sm">{rank}</span>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">排行榜</h1>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="card p-10 text-center">
          <BarChart3 className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-dark-400">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Zap className="w-16 h-16" />} title="还没有排名数据" message="去题库刷题，成为第一个上榜的人！" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-4 text-dark-400 text-sm font-medium w-16">排名</th>
                  <th className="text-left py-3 px-4 text-dark-400 text-sm font-medium">用户</th>
                  <th className="text-center py-3 px-4 text-dark-400 text-sm font-medium">通过题数</th>
                  <th className="text-center py-3 px-4 text-dark-400 text-sm font-medium hidden md:table-cell">通过率</th>
                  <th className="text-center py-3 px-4 text-dark-400 text-sm font-medium hidden md:table-cell">总提交</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const passRate = entry.total_submissions > 0
                    ? Math.round((entry.accepted / entry.total_submissions) * 100)
                    : 0;

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-dark-800 hover:bg-dark-800/50 transition-colors ${
                        entry.rank <= 3 ? 'bg-dark-800/20' : ''
                      } ${user && entry.id === user.id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-dark-500" />
                          <span className={`font-medium ${
                            entry.rank <= 3 ? 'text-white' : 'text-dark-200'
                          }`}>
                            {entry.username}
                          </span>
                          {user && entry.id === user.id && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary-500/20 text-primary-400 rounded">你</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-400 font-semibold">{entry.solved}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden hidden md:block">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${passRate}%` }}
                            />
                          </div>
                          <span className="text-dark-400 text-xs">{passRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-dark-400 hidden md:table-cell">
                        {entry.total_submissions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
