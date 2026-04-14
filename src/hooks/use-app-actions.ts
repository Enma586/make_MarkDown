import { useCallback, type Dispatch, type SetStateAction } from "react";
import { smartStructure } from "@/lib/file-utils";
import { structureWithAI } from "@/lib/ai-service";
import type { AISettings } from "@/hooks/use-ai-settings";

interface UseAppActionsParams {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  setMobileSheetOpen: Dispatch<SetStateAction<boolean>>;
  setShowFileImporter: Dispatch<SetStateAction<boolean>>;
  setShowAISettings: Dispatch<SetStateAction<boolean>>;
  setIsPasting: Dispatch<SetStateAction<boolean>>;
  setIsAIProcessing: Dispatch<SetStateAction<boolean>>;
  setAiError: Dispatch<SetStateAction<string | null>>;
  aiConfigured: boolean;
  aiSettings: AISettings;
  clearSaved: () => void;
}

export function useAppActions({
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
}: UseAppActionsParams) {
  const handleInject = useCallback(
    (markdown: string) => {
      setContent((prev) => prev + "\n\n" + markdown);
      setMobileSheetOpen(false);
    },
    [setContent, setMobileSheetOpen],
  );

  const handleImport = useCallback(
    (markdown: string) => {
      setContent(markdown);
    },
    [setContent],
  );

  const handleSmartPaste = useCallback(
    (markdown: string) => {
      setContent((prev) => prev + "\n\n" + markdown);
    },
    [setContent],
  );

  const handleClipboardPaste = useCallback(async () => {
    setIsPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        const structured = smartStructure(text, "clipboard.txt");
        setContent(structured);
      }
    } catch {
      setShowFileImporter(true);
    } finally {
      setIsPasting(false);
    }
  }, [setContent, setIsPasting, setShowFileImporter]);

  const handleAIStructure = useCallback(async () => {
    if (!content.trim()) {
      setAiError("No hay contenido para analizar");
      return;
    }
    if (!aiConfigured) {
      setShowAISettings(true);
      return;
    }

    setIsAIProcessing(true);
    setAiError(null);

    try {
      const result = await structureWithAI(content, "document", aiSettings);
      setContent(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setAiError(message);
    } finally {
      setIsAIProcessing(false);
    }
  }, [content, aiConfigured, aiSettings, setContent, setIsAIProcessing, setAiError, setShowAISettings]);

  const handleExport = useCallback(() => {
    if (!content.trim()) return;
    const sanitized = content.replace(/\u200B/g, "").replace(/\u00A0/g, " ");
    const blob = new Blob([sanitized], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const handleClear = useCallback(() => {
    setContent("");
    clearSaved();
  }, [setContent, clearSaved]);

  const handleCopyMarkdown = useCallback(async () => {
    await navigator.clipboard.writeText(content);
  }, [content]);

  const handleCopyHTML = useCallback(async () => {
    const previewEl = document.getElementById("preview-scroll");
    if (previewEl) {
      const article = previewEl.querySelector(".prose-docu");
      if (article) {
        await navigator.clipboard.writeText(article.innerHTML);
      }
    }
  }, []);

  return {
    handleInject,
    handleImport,
    handleSmartPaste,
    handleClipboardPaste,
    handleAIStructure,
    handleExport,
    handleClear,
    handleCopyMarkdown,
    handleCopyHTML,
  };
}
