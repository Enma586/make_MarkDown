import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Zap, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BLUEPRINTS } from "./blueprints/data";
import { CATEGORIES } from "./blueprints/category-icons";
import { CategorySection } from "./blueprints/CategorySection";
import type { BlueprintSidebarProps } from "./blueprints/types";

export const BlueprintSidebar = ({ onInject }: BlueprintSidebarProps) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const blueprintsByCategory = (cat: string) =>
    BLUEPRINTS.filter((b) => b.category === cat);

  return (
    <aside className="w-72 border-r border-border/40 bg-background/60 backdrop-blur-xl flex flex-col h-full">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-border/30">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            {t("sidebar.title")}
          </h2>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {BLUEPRINTS.length} {t("sidebar.templates")}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat, idx) => (
            <CategorySection
              key={cat}
              category={cat}
              items={blueprintsByCategory(cat)}
              index={idx}
              isCollapsed={collapsed[cat] ?? false}
              onToggle={() => toggleCategory(cat)}
              onInject={onInject}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-border/30">
        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">
          <History className="w-3 h-3" />
          <span>{t("sidebar.clickToInject")}</span>
        </div>
      </div>
    </aside>
  );
};
