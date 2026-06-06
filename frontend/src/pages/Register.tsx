import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      toast.error('请填写所有字段');
      return;
    }

    if (password.length < 6) {
      toast.error('密码长度至少为6位');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.auth.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      login(res.token, res.user);
      toast.success('注册成功');
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.message || '注册失败，请稍后重试';
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
          注册
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              用户名
            </label>
            <div className="relative">
              <UserIcon
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input pl-10 w-full"
                autoComplete="username"
              />
            </div>
          </div>

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
                placeholder="至少6位密码"
                className="input pl-10 w-full"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              确认密码
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="input pl-10 w-full"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            {submitting ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          已有账号？{' '}
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}
