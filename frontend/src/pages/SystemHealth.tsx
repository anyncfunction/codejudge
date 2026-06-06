import { useState, useEffect } from 'react';
import { Activity, Database, Users, FileText, Server, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/health').then(r => r.json()),
      fetch('/api/problems/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('oj_token')}` } }).then(r => r.json()),
    ])
    .then(([h, stats]) => {
      setHealth(h);
      setAdminStats(stats);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Activity className="w-7 h-7 text-primary-400" /> 系统状态
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">服务器状态</h2>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">运行中</span>
          </div>
          <div className="flex items-center gap-2 text-dark-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{health?.timestamp ? new Date(health.timestamp).toLocaleString('zh-CN') : '-'}</span>
          </div>
        </div>

        {/* Database Stats */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">数据统计</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: FileText, label: '题目总数', value: adminStats?.totalProblems ?? '-', color: 'text-blue-400' },
              { icon: Users, label: '用户总数', value: adminStats?.totalUsers ?? '-', color: 'text-emerald-400' },
              { icon: Activity, label: '提交总数', value: adminStats?.totalSubmissions ?? '-', color: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-dark-300 text-sm">{item.label}</span>
                </div>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-dark-700">
              <span className="text-dark-400 text-xs">接受率</span>
              <span className="text-emerald-400 text-sm font-medium">{adminStats?.acceptanceRate ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
