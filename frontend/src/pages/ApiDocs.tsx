import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Shield, Lock, Globe } from 'lucide-react';

interface Endpoint {
  method: string; path: string; auth: string | boolean; desc: string;
}

export default function ApiDocs() {
  const [data, setData] = useState<{ endpoints: Endpoint[] } | null>(null);

  useEffect(() => {
    fetch('/api/problems/docs').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const methodColors: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-500/10',
    POST: 'text-blue-400 bg-blue-500/10',
    PUT: 'text-amber-400 bg-amber-500/10',
    DELETE: 'text-red-400 bg-red-500/10',
  };

  const authIcon = (auth: string | boolean) => {
    if (auth === 'admin') return <Shield className="w-3.5 h-3.5 text-red-400" />;
    if (auth) return <Lock className="w-3.5 h-3.5 text-amber-400" />;
    return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <BookOpen className="w-7 h-7 text-primary-400" /> API 文档
      </h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-dark-400 text-sm font-medium">方法</th>
                <th className="text-left py-3 px-4 text-dark-400 text-sm font-medium">路径</th>
                <th className="text-left py-3 px-4 text-dark-400 text-sm font-medium">说明</th>
                <th className="text-center py-3 px-4 text-dark-400 text-sm font-medium">认证</th>
              </tr>
            </thead>
            <tbody>
              {data?.endpoints.map((ep, i) => (
                <tr key={i} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${methodColors[ep.method] || 'text-dark-400 bg-dark-700'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <code className="text-dark-200 text-sm font-mono">{ep.path}</code>
                  </td>
                  <td className="py-2.5 px-4 text-dark-300 text-sm">{ep.desc}</td>
                  <td className="py-2.5 px-4 text-center flex justify-center">
                    {authIcon(ep.auth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6 text-xs text-dark-500">
        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> 无需认证</span>
        <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-amber-400" /> 需登录</span>
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-red-400" /> 需管理员</span>
      </div>
    </div>
  );
}
