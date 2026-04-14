import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileCode, X, ClipboardPaste, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { filesToMarkdown } from "@/lib/file-utils";

interface FileImporterProps {
  open: boolean;
  onClose: () => void;
  onImport: (markdown: string) => void;
}

interface FileEntry {
  name: string;
  size: number;
  content: string;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export const FileImporter = ({ open, onClose, onImport }: FileImporterProps) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const entries: FileEntry[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > 5 * 1024 * 1024) {
        entries.push({
          name: file.name,
          size: file.size,
          content: "",
          error: t("importer.maxSize"),
        });
        continue;
      }

      try {
        const content = await file.text();
        entries.push({ name: file.name, size: file.size, content });
      } catch {
        entries.push({
          name: file.name,
          size: file.size,
          content: "",
          error: t("importer.readError"),
        });
      }
    }

    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const handlePasteFromClipboard = async () => {
    setIsPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setFiles((prev) => [
          ...prev,
          {
            name: "clipboard.txt",
            size: new Blob([text]).size,
            content: text,
          },
        ]);
      }
    } catch {
      // clipboard access denied
    } finally {
      setIsPasting(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    const validFiles = files.filter((f) => f.content);
    if (validFiles.length === 0) return;
    const markdown = filesToMarkdown(
      validFiles.map((f) => ({ name: f.name, content: f.content })),
    );
    onImport(markdown);
    handleClose();
  };

  const handleClose = () => {
    setFiles([]);
    setIsDragging(false);
    onClose();
  };

  if (!open) return null;

  const hasValidFiles = files.some((f) => f.content);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg mx-4 bg-background border border-border/40 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("importer.title")}</h2>
              <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">
                {t("importer.subtitle")}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-5 flex flex-col gap-3">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/40 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileCode className="w-7 h-7 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                {t("importer.dragHere")}
              </p>
              <p className="text-[9px] text-muted-foreground/40 mt-1 font-mono">
                {t("importer.supported")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-[9px] text-muted-foreground/30 font-mono uppercase">{t("importer.or")}</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            <Button
              variant="outline"
              className="w-full h-9 text-xs gap-2"
              onClick={handlePasteFromClipboard}
              disabled={isPasting}
            >
              {isPasting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ClipboardPaste className="w-3.5 h-3.5" />
              )}
              {t("importer.pasteClipboard")}
            </Button>

            {files.length > 0 && (
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-muted/30 group"
                  >
                    <FileCode className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono truncate">{file.name}</p>
                      <p className="text-[9px] text-muted-foreground/50 font-mono">
                        {formatBytes(file.size)}
                        {file.error && (
                          <span className="text-destructive ml-2">{file.error}</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(i)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/30 bg-muted/10">
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleClose}>
              {t("importer.cancel")}
            </Button>
            <Button
              size="sm"
              className="text-xs"
              disabled={!hasValidFiles}
              onClick={handleImport}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {t("importer.importAndStructure")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
