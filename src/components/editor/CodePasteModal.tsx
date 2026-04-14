import { useState, useRef, useEffect } from "react";
import { ClipboardPaste, X, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { detectCodeLanguage } from "@/lib/file-utils";

interface CodePasteModalProps {
  open: boolean;
  onClose: () => void;
  onPaste: (markdown: string) => void;
}

const LANGUAGES = [
  "auto",
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
  "java",
  "sql",
  "bash",
  "json",
  "yaml",
  "html",
  "css",
  "dockerfile",
  "graphql",
  "elixir",
  "ruby",
  "php",
  "csharp",
  "kotlin",
  "swift",
  "text",
];

export const CodePasteModal = ({ open, onClose, onPaste }: CodePasteModalProps) => {
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("");
  const [language, setLanguage] = useState("auto");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setFilename("");
      setLanguage("auto");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const detectedLang = language === "auto" ? detectCodeLanguage(code) || "text" : language;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
    } catch {
      textareaRef.current?.focus();
    }
  };

  const handleInsert = () => {
    if (!code.trim()) return;

    const header = filename.trim()
      ? `## ${filename.trim()}\n\n`
      : "";

    const block = `${header}\`\`\`${detectedLang}\n${code.trimEnd()}\n\`\`\``;
    onPaste(block);
    handleClose();
  };

  const handleClose = () => {
    setCode("");
    setFilename("");
    setLanguage("auto");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleInsert();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!open) return null;

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
          className="w-full max-w-xl mx-4 bg-background border border-border/40 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Pegar codigo</h2>
            </div>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-5 flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Nombre del archivo (opcional)"
                className="flex-1 h-8 text-xs font-mono"
              />
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-8 px-3 text-xs font-mono bg-muted/50 border border-border/40 rounded-md appearance-none pr-7 cursor-pointer text-foreground"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l === "auto" ? `Auto (${detectedLang})` : l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Pega tu codigo aqui..."
                spellCheck={false}
                className="w-full h-56 bg-muted/20 border border-border/30 rounded-lg p-3 font-mono text-xs leading-relaxed outline-none resize-none text-foreground placeholder:text-muted-foreground/30 focus:border-primary/40 transition-colors custom-scrollbar"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 text-[10px] gap-1 opacity-60 hover:opacity-100"
                onClick={handlePasteFromClipboard}
              >
                <ClipboardPaste className="w-3 h-3" />
                Pegar
              </Button>
            </div>

            {code.trim() && (
              <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/50">
                <Wand2 className="w-3 h-3" />
                <span>
                  Lenguaje detectado: <span className="text-primary">{detectedLang}</span>
                </span>
                <span className="ml-auto">
                  {code.split("\n").length}L &middot; {new Blob([code]).size}B
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-muted/10">
            <span className="text-[9px] text-muted-foreground/40 font-mono">
              Ctrl+Enter para insertar
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="text-xs"
                disabled={!code.trim()}
                onClick={handleInsert}
              >
                <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
                Insertar
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
