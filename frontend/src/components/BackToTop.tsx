import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-8 right-8 z-50 w-10 h-10 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg shadow-primary-600/25 flex items-center justify-center transition-all duration-200 hover:scale-110"
      title="回到顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
