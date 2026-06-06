import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, User, LogOut, ShieldCheck, Dices, Menu, X, Activity, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleRandom = async () => {
    setLoadingRandom(true);
    try {
      const data = await fetch('/api/problems/random').then(r => r.json());
      if (data.problem) {
        navigate(`/problems/${data.problem.id}`);
      }
    } finally {
      setLoadingRandom(false);
    }
  };

  const navLinks = [
    { to: '/problems', label: '题库' },
    { to: '/leaderboard', label: '排行榜' },
    { to: '/submissions', label: '提交记录' },
    { to: '/api-docs', label: 'API' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 text-white hover:text-primary-400 transition-colors">
            <Code2 className="w-7 h-7 text-primary-500" />
            <span className="text-xl font-bold tracking-tight">CodeJudge</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
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
            <button
              onClick={handleRandom}
              disabled={loadingRandom}
              className="px-4 py-2 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Dices className="w-4 h-4" />
              随机
            </button>
            <div className="relative">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-500 pointer-events-none" />
              <input
                type="number"
                min="1"
                placeholder="跳转"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val) && val >= 1) {
                      navigate(`/problems/${val}`);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                className="w-20 pl-7 pr-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-dark-200 placeholder-dark-500 focus:outline-none focus:border-primary-600/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-dark-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-b border-dark-800 md:hidden z-50">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm ${location.pathname.startsWith(link.to) ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-dark-200'}`}>
                  {link.label}
                </Link>
              ))}
              <hr className="border-dark-700 my-2" />
              {user ? (
                <>
                  <span className="block px-4 py-2 text-sm text-dark-300">{user.username}</span>
                  {user.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-primary-400">管理中心</Link>}
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-dark-400">退出登录</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-dark-200">登录</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-primary-400">注册</Link>
                </>
              )}
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-dark-300 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user.username}</span>
              </Link>
              {user.role === 'admin' && (<>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600/15 text-primary-400 border border-primary-600/30 hover:bg-primary-600/25 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  管理
                </Link>
                <Link to="/system" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/15 text-blue-400 border border-blue-600/30 hover:bg-blue-600/25 transition-colors">
                  <Activity className="w-3.5 h-3.5" /> 系统
                </Link>
              </>)}
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
