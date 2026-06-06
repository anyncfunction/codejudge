import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('请填写邮箱和密码');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.auth.login({ email: email.trim(), password });
      login(res.token, res.user);
      toast.success('登录成功');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.message || '登录失败，请检查邮箱和密码';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (user) return null;

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          登录
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">邮箱</label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="input pl-10 w-full"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">密码</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="input pl-10 w-full"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          还没有账号？{' '}
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
