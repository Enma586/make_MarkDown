import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAutoSave } from "@/hooks/use-autosave";
import { useAISettings } from "@/hooks/use-ai-settings";
import { useAppActions } from "@/hooks/use-app-actions";
import { BlueprintSidebar } from "@/components/sidebar/BlueprintSidebar";
import { type CodeEditorHandle } from "@/components/editor/CodeEditor";
import { FileImporter } from "@/components/editor/FileImporter";
import { AISettingsModal } from "@/components/ai/AISettingsModal";
import { RepoImporter } from "@/components/ai/RepoImporter";
import { Header } from "@/components/layout/Header";
import { Banners } from "@/components/layout/Banners";
import { EditorArea } from "@/components/layout/EditorArea";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getDefaultContent, type ViewMode } from "@/lib/constants";

export function App() {
  const { t } = useTranslation();
  const editorRef = useRef<CodeEditorHandle>(null);
  const [content, setContent] = useState(() => getDefaultContent(t));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [showSearch, setShowSearch] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [copied, setCopied] = useState<"md" | "html" | null>(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [showFileImporter, setShowFileImporter] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showRepoImporter, setShowRepoImporter] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [language, setLanguage] = useState(() => i18n.language || "es");

  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { settings: aiSettings, updateSettings: updateAISettings, isConfigured: aiConfigured } = useAISettings();
  const { savedAt, isRestored, restore, clearSaved } = useAutoSave(content);

  const actions = useAppActions({
    content,
    setContent,
    setMobileSheetOpen,
    setShowFileImporter,
    setShowAISettings,
    setIsPasting,
    setIsAIProcessing,
    setAiError,
    aiConfigured,
    aiSettings,
    clearSaved,
  });

  useEffect(() => {
    if (aiError) {
      const timer = setTimeout(() => setAiError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [aiError]);

  useEffect(() => {
    if (isRestored && content === getDefaultContent(t)) {
      const saved = restore();
      if (saved && saved !== getDefaultContent(t)) {
        setShowRestoreBanner(true);
      }
    }
  }, [isRestored]);

  const handleRestore = () => {
    const saved = restore();
    if (saved) {
      setContent(saved);
      setShowRestoreBanner(false);
    }
  };

  const handleCopyMarkdown = async () => {
    await actions.handleCopyMarkdown();
    setCopied("md");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyHTML = async () => {
    await actions.handleCopyHTML();
    setCopied("html");
    setTimeout(() => setCopied(null), 2000);
  };

  const cycleViewMode = () => {
    setViewMode((prev) => {
      if (prev === "split") return "editor";
      if (prev === "editor") return "preview";
      return "split";
    });
  };

  const handleTocNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleToggleLanguage = useCallback(() => {
    const newLang = language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("docu-stream-lang", newLang);
    setLanguage(newLang);
  }, [language]);

  const textareaRef = editorRef.current?.textareaRef;
  const sidebarContent = <BlueprintSidebar onInject={actions.handleInject} />;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {!isMobile && sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="shrink-0 overflow-hidden border-r border-border/40"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && (
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Blueprints</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      <FileImporter
        open={showFileImporter}
        onClose={() => setShowFileImporter(false)}
        onImport={actions.handleImport}
      />

      <AISettingsModal
        open={showAISettings}
        onClose={() => setShowAISettings(false)}
        settings={aiSettings}
        onSave={updateAISettings}
      />

      <RepoImporter
        open={showRepoImporter}
        onClose={() => setShowRepoImporter(false)}
        onImport={actions.handleImport}
        aiSettings={aiSettings}
        aiConfigured={aiConfigured}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          content={content}
          savedAt={savedAt}
          viewMode={viewMode}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
          isPasting={isPasting}
          isAIProcessing={isAIProcessing}
          aiConfigured={aiConfigured}
          copied={copied}
          theme={theme}
          language={language}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenMobileSidebar={() => setMobileSheetOpen(true)}
          onClipboardPaste={actions.handleClipboardPaste}
          onOpenFileImporter={() => setShowFileImporter(true)}
          onOpenRepoImporter={() => setShowRepoImporter(true)}
          onAIStructure={actions.handleAIStructure}
          onOpenAISettings={() => setShowAISettings(true)}
          onToggleSearch={() => setShowSearch(!showSearch)}
          onToggleToc={() => setShowToc(!showToc)}
          onCycleViewMode={cycleViewMode}
          onCopyMarkdown={handleCopyMarkdown}
          onCopyHTML={handleCopyHTML}
          onClear={actions.handleClear}
          onExport={actions.handleExport}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onToggleLanguage={handleToggleLanguage}
        />

        <Banners
          aiError={aiError}
          showRestoreBanner={showRestoreBanner}
          isAIProcessing={isAIProcessing}
          aiModel={aiSettings.model}
          onDismissError={() => setAiError(null)}
          onDismissRestore={() => setShowRestoreBanner(false)}
          onRestore={handleRestore}
        />

        <div className="flex-1 flex min-h-0">
          <EditorArea
            content={content}
            viewMode={viewMode}
            isMobile={isMobile}
            showSearch={showSearch}
            showToc={showToc}
            editorRef={editorRef}
            textareaRef={textareaRef!}
            onContentChange={setContent}
            onSmartPaste={actions.handleSmartPaste}
            onTocNavigate={handleTocNavigate}
            onCloseSearch={() => setShowSearch(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
