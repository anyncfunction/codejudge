import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Award, TrendingUp, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Lock, Key, CalendarDays, Code, PieChart, Trash2, Trophy, LogIn, Flame, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import type { Submission } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import GamificationSection from '../components/GamificationSection';
import DailyGoal from '../components/DailyGoal';

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  accepted: {
    label: '通过',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  wrong_answer: {
    label: '答案错误',
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  runtime_error: {
    label: '运行错误',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  compile_error: {
    label: '编译错误',
    icon: <Zap className="w-3.5 h-3.5" />,
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  time_limit: {
    label: '超时',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
};

export default function Profile() {
  useDocumentTitle('个人中心');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<Set<string>>(new Set());
  const [languageStats, setLanguageStats] = useState<{language: string; count: number}[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<any[]>([]);
  const [difficultyStats, setDifficultyStats] = useState<{difficulty: string; count: number}[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('oj_token');
    if (!token) return;
    fetch('/api/auth/solved-calendar', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setCalendarDates(new Set(data.dates || []));
      })
      .catch(() => {});
    fetch('/api/auth/language-stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setLanguageStats(data.languages || []);
      })
      .catch(() => {});
    fetch('/api/submissions?page=1&limit=1000', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const submissions = data.submissions || [];
        const statusCount: Record<string, number> = {};
        submissions.forEach((s: any) => { statusCount[s.status] = (statusCount[s.status] || 0) + 1; });
        setSubmissionStatus(Object.entries(statusCount).map(([status, count]) => ({ status, count })));
      })
      .catch(() => {});
    api.auth.difficultyStats().then(res => setDifficultyStats(res.difficulties || [])).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, subData] = await Promise.all([
          api.auth.profile(),
          api.submissions.list({ page: 1 }),
        ]);
        setProfile(profileData);
        setSubmissions(subData.submissions ?? []);
      } catch (err: any) {
        setError(err.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="card p-8 animate-pulse space-y-4">
        <div className="h-7 bg-dark-700 rounded w-1/3" />
        <div className="h-4 bg-dark-700 rounded w-1/2" />
        <div className="flex gap-4 mt-6">
          <div className="h-24 bg-dark-700 rounded flex-1" />
          <div className="h-24 bg-dark-700 rounded flex-1" />
          <div className="h-24 bg-dark-700 rounded flex-1" />
          <div className="h-24 bg-dark-700 rounded flex-1" />
        </div>
        <div className="h-4 bg-dark-700 rounded w-1/4 mt-6" />
        <div className="space-y-3">
          <div className="h-14 bg-dark-700 rounded" />
          <div className="h-14 bg-dark-700 rounded" />
          <div className="h-14 bg-dark-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-10 text-center">
        <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          重试
        </button>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="card p-10 text-center">
        <AlertTriangle size={40} className="mx-auto text-yellow-400 mb-3" />
        <p className="text-gray-300 mb-4">请先登录</p>
        <Link to="/login" className="btn-primary">
          前往登录
        </Link>
      </div>
    );
  }

  const stats = profile.stats || { total: 0, accepted: 0 };
  const acceptanceRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
  const uniqueProblems = new Set(submissions.map((s) => s.problem_id)).size;
  const avgScore = submissions.length > 0 ? Math.round(submissions.reduce((s: number, sub: any) => s + (sub.score || 0), 0) / submissions.length) : 0;
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* User info card */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">
              {profile.username || user.username}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-dark-300">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {profile.email || user.email}
              </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {profile.role === 'admin' ? '管理员' : '用户'}
                </span>
                {profile.last_login && (
                  <span className="flex items-center gap-1.5" title={profile.last_login}>
                    <LogIn className="w-3.5 h-3.5" />
                    上次登录 {(() => {
                      const diff = Date.now() - new Date(profile.last_login).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return '刚刚';
                      if (mins < 60) return `${mins}分钟前`;
                      const hours = Math.floor(mins / 60);
                      if (hours < 24) return `${hours}小时前`;
                      const days = Math.floor(hours / 24);
                      if (days < 30) return `${days}天前`;
                      return profile.last_login.slice(0, 10);
                    })()}
                  </span>
                )}
                {profile.created_at && (
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  加入于 {formatDate(profile.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <p className="text-dark-400 text-xs uppercase tracking-wide mb-1">
            总提交
          </p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-dark-400 text-xs uppercase tracking-wide mb-1">
            通过
          </p>
          <p className="text-2xl font-bold text-emerald-400">{stats.accepted}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-dark-400 text-xs uppercase tracking-wide mb-1">
            通过率
          </p>
          <p className="text-2xl font-bold text-blue-400">{acceptanceRate}%</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-dark-400 text-xs uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" />
            已解题目
          </p>
          <p className="text-2xl font-bold text-purple-400">{uniqueProblems}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-dark-400 text-xs uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
            <Trophy className="w-3 h-3" />
            排名
          </p>
          <p className="text-2xl font-bold text-yellow-400">#{stats.rank ?? '-'}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-dark-400 text-xs uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            平均分
          </p>
          <p className="text-2xl font-bold text-cyan-400">{avgScore}</p>
        </div>
      </div>

      {/* Language usage */}
      {languageStats.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-blue-400" /> 使用语言统计
          </h3>
          <div className="space-y-2">
            {languageStats.map((lang: {language: string; count: number}) => {
              const maxCount = Math.max(...languageStats.map((l: any) => l.count));
              return (
                <div key={lang.language} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-dark-400 text-right">{lang.language || '未知'}</span>
                  <div className="flex-1 h-4 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${(lang.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-dark-400 w-8">{lang.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Difficulty distribution */}
      {difficultyStats.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> 通过题目难度分布
          </h3>
          <div className="space-y-2">
            {['easy', 'medium', 'hard'].map(d => {
              const item = difficultyStats.find(s => s.difficulty === d);
              const count = item?.count || 0;
              const total = difficultyStats.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const colorMap: Record<string, string> = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-red-500' };
              const labelMap: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-12 text-xs text-dark-400 text-right">{labelMap[d]}</span>
                  <div className="flex-1 h-4 bg-dark-700 rounded-full overflow-hidden">
                    <div className={`h-full ${colorMap[d]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-dark-400 w-16 text-right">{count}题 ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status distribution */}
      {submissionStatus.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" /> 提交状态分布
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {submissionStatus.map((item: {status: string; count: number}) => {
              const maxCount = Math.max(...submissionStatus.map((s: any) => s.count));
              const colorMap: Record<string, string> = {
                accepted: 'bg-emerald-500', wrong_answer: 'bg-red-500',
                compile_error: 'bg-yellow-500', time_limit: 'bg-purple-500',
                runtime_error: 'bg-orange-500',
              };
              const labelMap: Record<string, string> = {
                accepted: '通过', wrong_answer: '答案错误',
                compile_error: '编译错误', time_limit: '超时',
                runtime_error: '运行错误',
              };
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${colorMap[item.status] || 'bg-dark-500'}`} />
                  <span className="flex-1 text-xs text-dark-400">{labelMap[item.status] || item.status}</span>
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className={`h-full ${colorMap[item.status] || 'bg-dark-500'} rounded-full`}
                      style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-dark-400 w-6 text-right">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> 成就
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Zap, label: '初次通过', earned: stats.accepted > 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Trophy, label: '10题通过', earned: stats.accepted >= 10, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Trophy, label: '50题通过', earned: stats.accepted >= 50, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: Award, label: '100题通过', earned: stats.accepted >= 100, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Flame, label: '连续7天', earned: (submissions.filter(s => s.status === 'accepted').length) > 0 && false, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { icon: Flame, label: '连续30天', earned: false, color: 'text-red-400', bg: 'bg-red-500/10' },
            { icon: TrendingUp, label: '通过率>80%', earned: acceptanceRate >= 80 && stats.total >= 10, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: Code, label: `#${stats.accepted}题`, earned: true, color: 'text-dark-400', bg: 'bg-dark-700/50' },
          ].map((a) => (
            <div key={a.label} className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border ${a.earned ? `${a.bg} border-${a.color.replace('text-', '')}/20` : 'bg-dark-800/30 border-dark-700/50 opacity-40'}`}>
              <a.icon className={`w-6 h-6 ${a.earned ? a.color : 'text-dark-600'}`} />
              <span className={`text-[10px] font-medium ${a.earned ? 'text-dark-200' : 'text-dark-600'}`}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      <DailyGoal />
      <GamificationSection />

      {/* Solved calendar */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-400" />
          解题日历
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {days.map((day) => {
            const hasSubmission = calendarDates.has(day);
            return (
              <div
                key={day}
                title={`${day} ${hasSubmission ? '已打卡' : '未打卡'}`}
                className={`w-3.5 h-3.5 rounded-sm transition-colors ${
                  hasSubmission ? 'bg-emerald-500' : 'bg-dark-700'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            已打卡
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-dark-700" />
            未打卡
          </span>
        </div>
      </div>

      {/* Password change */}
      <div className="card p-6">
        <button
          onClick={() => {
            setShowPasswordForm(!showPasswordForm);
            setPasswordMessage(null);
            setPasswordError(null);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Lock className="w-4 h-4" />
          {showPasswordForm ? '收起修改密码' : '修改密码'}
        </button>
        {showPasswordForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPasswordError(null);
              setPasswordMessage(null);

              if (!currentPassword || !newPassword || !confirmPassword) {
                setPasswordError('请填写所有字段');
                return;
              }
              if (newPassword.length < 6) {
                setPasswordError('新密码长度至少6位');
                return;
              }
              if (newPassword !== confirmPassword) {
                setPasswordError('两次输入的新密码不一致');
                return;
              }

              setPasswordLoading(true);
              try {
                await api.auth.changePassword({ currentPassword, newPassword });
                setPasswordMessage('密码修改成功');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              } catch (err: any) {
                setPasswordError(err.message || '修改失败');
              } finally {
                setPasswordLoading(false);
              }
            }}
            className="mt-4 space-y-3"
          >
            <div>
              <label className="block text-sm text-dark-400 mb-1">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input w-full"
                placeholder="输入当前密码"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input w-full"
                placeholder="输入新密码（至少6位）"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full"
                placeholder="再次输入新密码"
              />
            </div>

            {passwordError && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {passwordError}
              </p>
            )}
            {passwordMessage && (
              <p className="text-emerald-400 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {passwordMessage}
              </p>
            )}

            <button type="submit" disabled={passwordLoading} className="btn-primary flex items-center gap-2">
              {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Key className="w-4 h-4" />
              确认修改
            </button>
          </form>
        )}
      </div>

      {/* Export Data */}
      <div className="card p-6">
        <button
          onClick={() => {
            const data = {
              profile,
              submissions: submissions.slice(0, 100),
              languageStats,
              submissionStatus,
              calendarDates: Array.from(calendarDates),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'codejudge_data.json'; a.click();
            URL.revokeObjectURL(url);
            toast.success('数据已导出');
          }}
          className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Download className="w-4 h-4" />
          导出我的数据
        </button>
        <p className="text-xs text-dark-500 mt-2">下载个人资料、提交记录和统计数据（JSON格式）</p>
      </div>

      {/* Delete Account */}
      <div className="card p-6 border-red-600/20">
        <button
          onClick={async () => {
            if (window.confirm('确定要删除账户吗？所有提交记录也将被永久删除。此操作不可撤销。')) {
              try {
                await api.auth.deleteAccount();
                toast.success('账户已删除');
                logout();
                navigate('/');
              } catch (err: any) {
                toast.error(err.message || '删除失败');
              }
            }
          }}
          className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          删除账户
        </button>
        <p className="text-xs text-dark-500 mt-2">删除后不可恢复，所有数据将被清除</p>
      </div>

      {/* Recent submissions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">最近提交</h2>
        {submissions.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">
            暂无提交记录
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const statusConfig = STATUS_MAP[sub.status] || {
                label: sub.status,
                icon: null,
                className: 'bg-dark-700 text-dark-400 border-dark-600',
              };
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between bg-dark-800/50 rounded-lg p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/problems/${sub.problem_id}`}
                      className="text-white hover:text-blue-400 transition-colors text-sm font-medium truncate block"
                    >
                      {sub.problem_title || `题目 #${sub.problem_id}`}
                    </Link>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {formatDate(sub.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${statusConfig.className}`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                    <span className="text-primary-400 text-sm font-semibold w-12 text-right">
                      {sub.score}分
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
