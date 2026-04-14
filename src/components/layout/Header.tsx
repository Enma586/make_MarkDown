import { useTranslation } from "react-i18next";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardPaste,
  Upload,
  Sparkles,
  Settings,
  Search,
  LayoutList,
  Columns2,
  Eye,
  Code2,
  Copy,
  ClipboardCopy,
  Check,
  Trash2,
  Download,
  Moon,
  Sun,
  Loader2,
  Save,
  Zap,
  GitFork as GitForkIcon,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ViewMode } from "@/lib/constants";

interface HeaderProps {
  content: string;
  savedAt: Date | null;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  isMobile: boolean;
  isPasting: boolean;
  isAIProcessing: boolean;
  aiConfigured: boolean;
  copied: "md" | "html" | null;
  theme: string;
  language: string;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onClipboardPaste: () => void;
  onOpenFileImporter: () => void;
  onOpenRepoImporter: () => void;
  onAIStructure: () => void;
  onOpenAISettings: () => void;
  onToggleSearch: () => void;
  onToggleToc: () => void;
  onCycleViewMode: () => void;
  onCopyMarkdown: () => void;
  onCopyHTML: () => void;
  onClear: () => void;
  onExport: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
}

function formatSavedTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export const Header = ({
  content,
  savedAt,
  viewMode,
  sidebarOpen,
  isMobile,
  isPasting,
  isAIProcessing,
  aiConfigured,
  copied,
  theme,
  language,
  onToggleSidebar,
  onOpenMobileSidebar,
  onClipboardPaste,
  onOpenFileImporter,
  onOpenRepoImporter,
  onAIStructure,
  onOpenAISettings,
  onToggleSearch,
  onToggleToc,
  onCycleViewMode,
  onCopyMarkdown,
  onCopyHTML,
  onClear,
  onExport,
  onToggleTheme,
  onToggleLanguage,
}: HeaderProps) => {
  const { t } = useTranslation();

  const langLabel = language === "en" ? "EN" : "ES";

  return (
    <header className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-border/30 bg-background/60 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {isMobile ? (
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onOpenMobileSidebar}>
            <Zap className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggleSidebar}>
            {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </Button>
        )}

        <Separator orientation="vertical" className="h-4" />

        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("app.title")}
        </span>

        <span className="text-[9px] font-mono text-muted-foreground/40 hidden sm:inline">
          {content.split("\n").length}{t("app.lines")} &middot;{" "}
          {content.trim() ? content.trim().split(/\s+/).length : 0}{t("app.words")} &middot;{" "}
          {new Blob([content]).size}{t("app.bytes")}
        </span>

        {savedAt && (
          <span className="text-[9px] font-mono text-muted-foreground/30 hidden md:inline-flex items-center gap-1">
            <Save className="w-2.5 h-2.5" />
            {formatSavedTime(savedAt)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClipboardPaste} disabled={isPasting}>
              {isPasting ? <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" /> : <ClipboardPaste className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">{t("header.pasteClipboard")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onOpenFileImporter}>
              <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">{t("header.importFiles")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onOpenRepoImporter}>
              <GitForkIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">{t("header.importRepo")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onAIStructure} disabled={isAIProcessing}>
              {isAIProcessing ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">{t("header.structureAI")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`w-6 h-6 ${aiConfigured ? "text-primary" : "text-muted-foreground/40"}`}
              onClick={onOpenAISettings}
            >
              <Settings className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">{t("header.configureAI")}</TooltipContent>
        </Tooltip>

        {!isMobile && (
          <>
            <Separator orientation="vertical" className="h-4" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggleSearch}>
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {t("header.search")} <kbd className="ml-1 px-1 py-0.5 rounded bg-muted font-mono text-[9px]">Ctrl+F</kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggleToc}>
                  <LayoutList className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">{t("header.toc")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onCycleViewMode}>
                  {viewMode === "split" ? <Columns2 className="w-3.5 h-3.5 text-muted-foreground" /> : viewMode === "editor" ? <Code2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {viewMode === "split" && t("header.split")}
                {viewMode === "editor" && t("header.editorOnly")}
                {viewMode === "preview" && t("header.previewOnly")}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onCopyMarkdown}>
                  {copied === "md" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">{t("header.copyMarkdown")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onCopyHTML}>
                  {copied === "html" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <ClipboardCopy className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">{t("header.copyHTML")}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4" />
          </>
        )}

        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClear}>
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>

        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onExport}>
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>

        <Separator orientation="vertical" className="h-4" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggleTheme}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-muted-foreground" /> : <Moon className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">{t("header.toggleTheme")}</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggleLanguage}>
              <Languages className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {langLabel === "EN" ? "Español" : "English"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};
