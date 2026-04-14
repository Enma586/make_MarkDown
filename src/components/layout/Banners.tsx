import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannersProps {
  aiError: string | null;
  showRestoreBanner: boolean;
  isAIProcessing: boolean;
  aiModel: string;
  onDismissError: () => void;
  onDismissRestore: () => void;
  onRestore: () => void;
}

export const Banners = ({
  aiError,
  showRestoreBanner,
  isAIProcessing,
  aiModel,
  onDismissError,
  onDismissRestore,
  onRestore,
}: BannersProps) => {
  const { t } = useTranslation();

  return (
    <>
      <AnimatePresence>
        {aiError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/5 border-b border-destructive/20">
              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              <span className="text-[11px] text-destructive/80 flex-1 truncate">{aiError}</span>
              <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={onDismissError}>
                <span className="text-xs text-muted-foreground">&times;</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showRestoreBanner && (
        <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-primary/20">
          <span className="text-xs text-foreground/70">{t("banners.restoreMsg")}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={onDismissRestore}>
              {t("banners.ignore")}
            </Button>
            <Button variant="default" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={onRestore}>
              <RotateCcw className="w-3 h-3" />
              {t("banners.restoreBtn")}
            </Button>
          </div>
        </div>
      )}

      {isAIProcessing && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/20">
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
          <span className="text-[11px] text-muted-foreground">{t("ai.processing", { model: aiModel })}</span>
        </div>
      )}
    </>
  );
};
