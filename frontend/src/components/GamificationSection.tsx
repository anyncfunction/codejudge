import { useState, useEffect } from 'react';
import { Flame, Zap, Award, Star, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StatsCheck { total: number; accepted: number; fullScore?: boolean; }

const ACHIEVEMENTS = [
  { id: 'first_submit', name: '初次提交', desc: '完成第一次提交', icon: '🚀', check: (s: StatsCheck) => s.total >= 1 },
  { id: 'ten_submits', name: '十次提交', desc: '累计提交10次', icon: '💪', check: (s: StatsCheck) => s.total >= 10 },
  { id: 'first_ac', name: '首次通过', desc: '通过第一道题目', icon: '🎉', check: (s: StatsCheck) => s.accepted >= 1 },
  { id: 'five_ac', name: '五题通关', desc: '通过5道题目', icon: '⭐', check: (s: StatsCheck) => s.accepted >= 5 },
  { id: 'ten_ac', name: '十题达人', desc: '通过10道题目', icon: '🏆', check: (s: StatsCheck) => s.accepted >= 10 },
  { id: 'full_mark', name: '满分选手', desc: '获得一次100分', icon: '💯', check: (s: StatsCheck) => s.fullScore === true },
];

export default function GamificationSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [todayChecked, setTodayChecked] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('oj_token');
    if (!token) return;

    fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStats(d.stats || { total: 0, accepted: 0 }))
      .catch(() => {});

    fetch('/api/auth/streak', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setStreak(d.streak || 0); setTodayChecked(d.todayChecked || false); })
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: a.check({ ...stats, fullScore: stats?.accepted >= 1 }),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Streak card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flame className={`w-6 h-6 ${streak > 0 ? 'text-orange-400' : 'text-dark-500'}`} />
          <h3 className="text-lg font-semibold text-white">连续打卡</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-4xl font-bold ${streak > 0 ? 'text-orange-400' : 'text-dark-500'}`}>
            {streak}
          </span>
          <span className="text-dark-400">天</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {todayChecked ? (
            <span className="flex items-center gap-1 text-emerald-400 text-sm">
              <CalendarCheck className="w-4 h-4" /> 今日已打卡
            </span>
          ) : (
            <span className="text-dark-500 text-sm">今日尚未提交</span>
          )}
        </div>
      </div>

      {/* Achievements card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">成就徽章</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`text-center p-2 rounded-lg transition-all ${
                a.unlocked ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-dark-800/50 border border-dark-700 opacity-40'
              }`}
              title={a.desc}
            >
              <span className="text-2xl block mb-1">{a.icon}</span>
              <p className={`text-xs ${a.unlocked ? 'text-amber-400' : 'text-dark-500'}`}>{a.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
