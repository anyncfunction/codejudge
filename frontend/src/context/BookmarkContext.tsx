import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface BookmarkContextType {
  bookmarks: Set<number>;
  toggleBookmark: (problemId: number) => void;
  isBookmarked: (problemId: number) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: new Set(),
  toggleBookmark: () => {},
  isBookmarked: () => false,
});

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('cj_bookmarks');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('cj_bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggleBookmark = useCallback((id: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: number) => bookmarks.has(id), [bookmarks]);

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => useContext(BookmarkContext);
