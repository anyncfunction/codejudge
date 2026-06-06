import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        window.location.href = '/problems';
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navLinks = [
    { to: '/problems', label: '题库' },
    { to: '/leaderboard', label: '排行榜' },
    { to: '/submissions', label: '提交记录' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 text-white hover:text-primary-400 transition-colors">
            <Code2 className="w-7 h-7 text-primary-500" />
            <span className="text-xl font-bold tracking-tight">CodeJudge</span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith(link.to)
                    ? 'bg-dark-700 text-white'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user.username}</span>
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600/15 text-primary-400 border border-primary-600/30 hover:bg-primary-600/25 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  管理
                </Link>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">登录</Link>
              <Link to="/register" className="btn-primary text-sm">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
