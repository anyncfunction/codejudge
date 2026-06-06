import { Github, Heart } from 'lucide-react';

export default function Footer() {
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
        </div>
        <p className="text-dark-500 text-xs">
          &copy; {new Date().getFullYear()} CodeJudge - 在线评测系统
        </p>
      </div>
    </footer>
  );
}
