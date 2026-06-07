import { Link } from 'react-router-dom';
import { FileQuestion, Home, List, Trophy, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <FileQuestion className="w-24 h-24 text-dark-600 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-dark-400 mb-4">404</h1>
        <p className="text-xl text-dark-300 mb-2">页面未找到</p>
        <p className="text-dark-500 mb-8">你访问的页面不存在或已被移除</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" /> 返回首页
          </Link>
          <Link to="/problems" className="btn-secondary inline-flex items-center gap-2">
            <List className="w-4 h-4" /> 去题库
          </Link>
          <Link to="/leaderboard" className="btn-secondary inline-flex items-center gap-2">
            <Trophy className="w-4 h-4" /> 排行榜
          </Link>
        </div>
      </div>
    </div>
  );
}
