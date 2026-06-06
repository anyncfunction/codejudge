import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, Code, BarChart3, AlertTriangle, Loader2, Activity, Percent, Clock, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Problem, ProblemStats, AdminStats } from '../types';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [problemsRes, statsRes] = await Promise.all([
        api.problems.list({ page: 1, limit: 100 }),
        api.problems.stats(),
      ]);
      setProblems(problemsRes.problems ?? []);
      setStats(statsRes);

      if (user?.role === 'admin') {
        try {
          const adminRes = await api.problems.getAdminStats();
          setAdminStats(adminRes);
        } catch { /* silently ignore */ }
      }
    } catch (err: any) {
      const msg = err.message || '加载数据失败';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/problems/export', { headers: { Authorization: `Bearer ${localStorage.getItem('oj_token')}` } });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'codejudge-problems.json'; a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch { toast.error('导出失败'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/problems/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('oj_token')}` },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      toast.success(result.message || '导入成功');
      fetchData();
    } catch { toast.error('导入失败，请检查文件格式'); }
    e.target.value = '';
  };

  const handleDelete = async (problemId: number, title: string) => {
    if (!window.confirm(`确定要删除题目「${title}」吗？此操作不可撤销。`)) {
      return;
    }
    setDeletingId(problemId);
    try {
      await api.problems.delete(problemId);
      setProblems((prev) => prev.filter((p) => p.id !== problemId));
      toast.success('删除成功');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const TYPE_LABELS: Record<string, string> = {
    programming: '编程题',
    choice: '选择题',
    fill_blank: '填空题',
  };

  const DIFFICULTY_LABELS: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'bg-green-600',
    medium: 'bg-yellow-600',
    hard: 'bg-red-600',
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-10 text-center">
          <AlertTriangle size={40} className="mx-auto text-yellow-400 mb-3" />
          <p className="text-gray-300 text-lg">无权限访问此页面</p>
          <p className="text-gray-500 text-sm mt-1">需要管理员权限</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">管理后台</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <BarChart3 size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">总题目数</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <Code size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.programming}
              </p>
              <p className="text-sm text-gray-400">编程题</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <Users size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.choice + stats.fill_blank}
              </p>
              <p className="text-sm text-gray-400">选择/填空题</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">系统概览</h2>

      {/* Admin Analytics */}
      {adminStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 rounded-lg">
              <Users size={24} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{adminStats.totalUsers}</p>
              <p className="text-sm text-gray-400">总用户数</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-cyan-600/20 rounded-lg">
              <Activity size={24} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{adminStats.totalSubmissions}</p>
              <p className="text-sm text-gray-400">总提交数</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-600/20 rounded-lg">
              <Percent size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{adminStats.acceptanceRate}%</p>
              <p className="text-sm text-gray-400">通过率</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-600/20 rounded-lg">
              <Clock size={24} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{adminStats.recent24h}</p>
              <p className="text-sm text-gray-400">24h 提交</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">题目管理</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/problems/new')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            创建题目
          </button>
          <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-1">
            <Download className="w-4 h-4" /> 导出
          </button>
          <button onClick={() => document.getElementById('importInput')?.click()} className="btn-secondary text-sm inline-flex items-center gap-1">
            <Upload className="w-4 h-4" /> 导入
          </button>
          <input id="importInput" type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-dark-700 rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary">
            重试
          </button>
        </div>
      ) : problems.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-400">暂无题目，点击上方按钮创建</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-gray-400 hidden md:table-cell">ID</th>
                <th className="text-left py-3 px-4 text-gray-400">标题</th>
                <th className="text-left py-3 px-4 text-gray-400">类型</th>
                <th className="text-left py-3 px-4 text-gray-400 hidden md:table-cell">难度</th>
                <th className="text-right py-3 px-4 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr
                  key={problem.id}
                  className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 hidden md:table-cell">{problem.id}</td>
                  <td className="py-3 px-4 text-white font-medium">
                    {problem.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded">
                      {TYPE_LABELS[problem.type] || problem.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span
                      className={`px-2 py-0.5 text-xs rounded text-white ${
                        DIFFICULTY_COLORS[problem.difficulty] || 'bg-gray-600'
                      }`}
                    >
                      {DIFFICULTY_LABELS[problem.difficulty] ||
                        problem.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          navigate(`/admin/problems/${problem.id}/edit`)
                        }
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(problem.id, problem.title)
                        }
                        disabled={deletingId === problem.id}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        {deletingId === problem.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
