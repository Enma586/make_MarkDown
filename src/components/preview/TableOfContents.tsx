import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ListTree } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  onNavigate: (id: string) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}

export const TableOfContents = ({ content, onNavigate }: TableOfContentsProps) => {
  const { t } = useTranslation();

  const items = useMemo<TocItem[]>(() => {
    const lines = content.split("\n");
    const result: TocItem[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      const match = line.match(/^(#{1,4})\s+(.+)/);
      if (!match) continue;

      const level = match[1].length;
      const text = match[2].trim();
      let id = slugify(text);

      let counter = 1;
      const baseId = id;
      while (seen.has(id)) {
        id = `${baseId}-${counter++}`;
      }
      seen.add(id);

      result.push({ id, text, level });
    }

    return result;
  }, [content]);

  if (items.length === 0) {
    return (
      <div className="w-52 shrink-0 border-l border-border/20 bg-muted/10 flex flex-col">
        <div className="px-3 py-2.5 border-b border-border/20 flex items-center gap-2">
          <ListTree className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            {t("preview.contents")}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-[0.2em]">
            {t("preview.noHeadings")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-52 shrink-0 border-l border-border/20 bg-muted/10 flex flex-col">
      <div className="px-3 py-2.5 border-b border-border/20 flex items-center gap-2">
        <ListTree className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
          {t("preview.contents")}
        </span>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground/30">
          {items.length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 flex flex-col gap-px">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="text-left px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate"
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              title={item.text}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
};
