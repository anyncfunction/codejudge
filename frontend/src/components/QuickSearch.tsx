import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';

interface ProblemResult {
  id: number;
  title: string;
  difficulty: string;
  type: string;
}

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProblemResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    setSelectedIndex(0);
    const controller = new AbortController();
    fetch(`/api/problems?search=${encodeURIComponent(query)}&limit=8&page=1`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { setResults(data.problems || []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  const handleSelect = (id: number) => {
    setOpen(false);
    navigate(`/problems/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex].id); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700">
          <Search className="w-5 h-5 text-dark-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索题目..."
            className="flex-1 bg-transparent text-white placeholder-dark-500 outline-none text-sm"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-dark-400" /></div>
          ) : results.length > 0 ? (
            results.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === selectedIndex ? 'bg-dark-600' : 'hover:bg-dark-700/50'}`}
              >
                <span className="text-[10px] text-dark-500 font-mono w-8 shrink-0">#{p.id}</span>
                <span className="flex-1 text-sm text-white truncate">{p.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  p.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  p.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>{p.difficulty === 'easy' ? '简单' : p.difficulty === 'medium' ? '中等' : '困难'}</span>
              </button>
            ))
          ) : query.trim() ? (
            <p className="text-center py-8 text-dark-500 text-sm">未找到相关题目</p>
          ) : (
            <p className="text-center py-8 text-dark-500 text-sm">输入关键词搜索题目</p>
          )}
        </div>
      </div>
    </div>
  );
}
