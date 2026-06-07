import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { keys: '/', desc: '跳转到搜索 / 题库' },
  { keys: 'Ctrl+K', desc: '全局搜索题目' },
  { keys: 'Ctrl+Enter', desc: '提交答案' },
  { keys: 'U', desc: '随机未做题' },
  { keys: '?', desc: '打开快捷键帮助' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-dark-800 border border-dark-600 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">快捷键</h3>
          </div>
          <button onClick={() => setOpen(false)} className="text-dark-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between">
              <span className="text-dark-300 text-sm">{s.desc}</span>
              <kbd className="px-2 py-1 bg-dark-700 text-dark-200 text-xs rounded border border-dark-600 font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <p className="text-dark-500 text-xs mt-4 text-center">按 Escape 或点击外部关闭</p>
      </div>
    </div>
  );
}
