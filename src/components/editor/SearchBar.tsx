import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
}

export const SearchBar = ({ value, textareaRef, onClose }: SearchBarProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(-1);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const findMatches = useCallback(
    (searchQuery: string) => {
      if (!searchQuery) {
        setTotalMatches(0);
        setMatchIndex(-1);
        return;
      }

      const lowerValue = value.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();
      const matches: number[] = [];
      let pos = 0;

      while (pos < lowerValue.length) {
        const idx = lowerValue.indexOf(lowerQuery, pos);
        if (idx === -1) break;
        matches.push(idx);
        pos = idx + 1;
      }

      setTotalMatches(matches.length);
      if (matches.length > 0) {
        const newIndex = matchIndex < 0 ? 0 : Math.min(matchIndex, matches.length - 1);
        setMatchIndex(newIndex);
        highlightMatch(matches[newIndex], searchQuery.length);
      } else {
        setMatchIndex(-1);
      }
    },
    [value, matchIndex],
  );

  const highlightMatch = (start: number, length: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(start, start + length);

    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const textBefore = ta.value.slice(0, start);
    const lineCount = textBefore.split("\n").length;
    ta.scrollTop = Math.max(0, (lineCount - 3) * lineHeight);
  };

  const goToNext = () => {
    if (totalMatches === 0) return;
    const next = (matchIndex + 1) % totalMatches;
    setMatchIndex(next);
    const lowerValue = value.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let pos = 0;
    for (let i = 0; i <= next; i++) {
      pos = lowerValue.indexOf(lowerQuery, pos) + 1;
    }
    highlightMatch(pos - 1, query.length);
  };

  const goToPrev = () => {
    if (totalMatches === 0) return;
    const prev = matchIndex <= 0 ? totalMatches - 1 : matchIndex - 1;
    setMatchIndex(prev);
    const lowerValue = value.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let pos = 0;
    for (let i = 0; i <= prev; i++) {
      pos = lowerValue.indexOf(lowerQuery, pos) + 1;
    }
    highlightMatch(pos - 1, query.length);
  };

  useEffect(() => {
    const timer = setTimeout(() => findMatches(query), 150);
    return () => clearTimeout(timer);
  }, [query, value, findMatches]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 border-b border-border/20">
      <div className="relative flex items-center">
        <Search className="w-3 h-3 text-muted-foreground/50 absolute left-2" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="h-6 w-48 pl-7 pr-2 text-xs font-mono bg-background border-border/30"
        />
      </div>

      {totalMatches > 0 && (
        <span className="text-[9px] font-mono text-muted-foreground/50 tabular-nums">
          {matchIndex + 1}/{totalMatches}
        </span>
      )}

      <div className="flex items-center gap-px">
        <Button
          variant="ghost"
          size="icon"
          className="w-5 h-5"
          onClick={goToPrev}
          disabled={totalMatches === 0}
        >
          <ChevronUp className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-5 h-5"
          onClick={goToNext}
          disabled={totalMatches === 0}
        >
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-5 h-5 ml-auto"
        onClick={onClose}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};
