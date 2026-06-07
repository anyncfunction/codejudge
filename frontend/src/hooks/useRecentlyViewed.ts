import { useState, useCallback } from 'react';

const STORAGE_KEY = 'oj_recently_viewed';
const MAX_ITEMS = 8;

interface RecentProblem {
  id: number;
  title: string;
}

function load(): RecentProblem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentProblem[]>(load);

  const addViewed = useCallback((id: number, title: string) => {
    const current = load();
    const filtered = current.filter(p => p.id !== id);
    const updated = [{ id, title }, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecent(updated);
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }, []);

  return { recent, addViewed, clearRecent };
}
