import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "docu-stream-content";
const DEBOUNCE_MS = 500;

export function useAutoSave(content: string) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setIsRestored(true);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, content);
      setSavedAt(new Date());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [content]);

  const restore = (): string | null => {
    return localStorage.getItem(STORAGE_KEY);
  };

  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedAt(null);
  };

  return { savedAt, isRestored, restore, clearSaved };
}
