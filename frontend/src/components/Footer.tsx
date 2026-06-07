import { Github, Heart, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setBackendOnline(d.status === 'ok'))
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <footer className="border-t border-dark-800 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-6 text-dark-400 text-sm mb-2">
          <a href="https://github.com/anyncfunction/codejudge" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-400" /> by CodeJudge
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full inline-block ${backendOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            {backendOnline ? '服务正常' : '连接中...'}
          </span>
        </div>
        <p className="text-dark-500 text-xs">
          &copy; {new Date().getFullYear()} CodeJudge - 在线评测系统
        </p>
      </div>
    </footer>
  );
}
