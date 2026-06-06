import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Award, TrendingUp, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Lock, Key, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Submission } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import GamificationSection from '../components/GamificationSection';

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
  const { user } = useAuth();
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

  useEffect(() => {
    const token = localStorage.getItem('oj_token');
    if (!token) return;
    fetch('/api/auth/solved-calendar', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setCalendarDates(new Set(data.dates || []));
      })
      .catch(() => {});
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      </div>

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
