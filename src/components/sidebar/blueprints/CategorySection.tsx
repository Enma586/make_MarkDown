import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { categoryIcons } from "./category-icons";
import type { Blueprint } from "./types";

interface CategorySectionProps {
  category: string;
  items: Blueprint[];
  index: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onInject: (content: string) => void;
}

export const CategorySection = ({
  category,
  items,
  index,
  isCollapsed,
  onToggle,
  onInject,
}: CategorySectionProps) => {
  return (
    <div>
      {index > 0 && <Separator className="my-2 opacity-40" />}

      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {categoryIcons[category]}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors">
            {category}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/50">
            {items.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pl-1 pt-1 pb-1">
              {items.map((bp) => (
                <motion.button
                  key={bp.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => onInject(bp.content)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-left hover:bg-primary/5 group/bp transition-colors"
                >
                  <span className="text-muted-foreground group-hover/bp:text-primary transition-colors">
                    {bp.icon}
                  </span>
                  <span className="text-xs text-muted-foreground group-hover/bp:text-foreground transition-colors">
                    {bp.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
