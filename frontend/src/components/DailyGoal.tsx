import { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GOAL_KEY = 'cj_daily_goal';

export default function DailyGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(() => {
    return Number(localStorage.getItem(GOAL_KEY)) || 5;
  });
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(goal));
  const [todaySolved, setTodaySolved] = useState(0);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('oj_token');
    if (!token) return;
    const today = new Date().toISOString().slice(0, 10);
    fetch('/api/auth/solved-calendar', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const dates = data.dates || [];
        setTodaySolved(dates.filter((d: string) => d === today).length);
      })
      .catch(() => {});
  }, [user]);

  const saveGoal = () => {
    const n = parseInt(inputValue);
    if (isNaN(n) || n < 1) { toast.error('请输入有效数字'); return; }
    setGoal(n);
    localStorage.setItem(GOAL_KEY, String(n));
    setEditing(false);
    toast.success(`每日目标已设为 ${n} 题`);
  };

  if (!user) return null;

  const progress = Math.min(100, (todaySolved / goal) * 100);
  const remaining = Math.max(0, goal - todaySolved);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-white">每日目标</h3>
      </div>
      
      {editing ? (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            min="1"
            max="100"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="input w-20 text-center"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && saveGoal()}
          />
          <span className="text-dark-400 text-sm">题/天</span>
          <button onClick={saveGoal} className="btn-primary text-xs px-3 py-1.5">确定</button>
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-3 py-1.5">取消</button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-2xl font-bold text-white">{todaySolved}</span>
            <span className="text-dark-400 text-sm">/ {goal}</span>
          </div>
          <button onClick={() => { setInputValue(String(goal)); setEditing(true); }} className="text-xs text-dark-400 hover:text-white transition-colors">
            修改
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress >= 100 ? 'bg-emerald-500' : 'bg-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        {progress >= 100 ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> 今日目标已完成！
          </span>
        ) : (
          <span className="text-dark-400 text-xs">还差 {remaining} 题完成今日目标</span>
        )}
      </div>
    </div>
  );
}
