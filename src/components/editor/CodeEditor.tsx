import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Code2 } from "lucide-react";
import { detectCodeLanguage } from "@/lib/file-utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSmartPaste?: (markdown: string) => void;
}

export interface CodeEditorHandle {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

function looksLikeCode(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;
  if (trimmed.includes("```")) return false;
  if (/^#\s+/m.test(trimmed) && !/^\s*(function|const|let|var|class|import|export|def |async |await |return |fn |func |pub )/m.test(trimmed)) return false;

  const codeIndicators = [
    /^\s*(function|const|let|var|class|import|export|from|require|def |async |await |return )/m,
    /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|BEGIN|COMMIT)\s/mi,
    /^\s*(def |class |import |from |if __name__|self\.)/m,
    /^\s*(func |package |import \(|fmt\.|log\.|type )/m,
    /^\s*(fn |let mut |use |pub fn|impl |struct |enum )/m,
    /^\s*{\s*\n/m,
    /^\s*\w+:\s+\w+/m,
    /^\s*(<!DOCTYPE|<html|<\?xml)/mi,
    /^\s*(public |private |protected |@Override|@Test)/m,
    /^\s*(FROM|RUN|COPY|WORKDIR|CMD|ENTRYPOINT|EXPOSE|ARG|ENV)\s/m,
    /^\s*(use\s+\{|mod\s+|pub\s+mod|pub\s+use)/m,
    /^\s*@\w+/m,
    /^\s*(interface|type|enum|trait|abstract|sealed|data class)/m,
    /^\s*(module|namespace|using\s+)/m,
    /^\s*\w+\s*=\s*(\(|function|\{|=>)/m,
    /^\s*(println!|print!|eprintln!|macro_rules!)/m,
    /^\s*(func |handler |middleware |router\.)/m,
    /^\s*(get|post|put|delete|patch)\s*[(/"]/m,
  ];

  let score = 0;
  for (const r of codeIndicators) {
    if (r.test(trimmed)) score++;
  }

  if (score >= 1) return true;

  const lines = trimmed.split("\n");
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length < 2) return false;

  const hasSpecialChars = /[{}();]/.test(trimmed);
  const hasOperators = /[=+\-*/<>!&|]/.test(trimmed);
  const hasAssignment = /^\s*\w+\s*=[^=]/m.test(trimmed);
  const hasParens = /\w+\(/.test(trimmed);
  const hasBrackets = /\[.*\]/.test(trimmed);

  if (hasSpecialChars && (hasAssignment || hasParens || hasBrackets)) return true;
  if (hasOperators && hasParens && nonEmptyLines.length > 3) return true;

  return false;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ value, onChange, placeholder, onSmartPaste }, ref) => {
    const { t } = useTranslation();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({ textareaRef }), []);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, []);

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text");
        if (!pasted || !looksLikeCode(pasted)) return;

        e.preventDefault();
        const lang = detectCodeLanguage(pasted) || "text";
        const block = `\n\`\`\`${lang}\n${pasted.trimEnd()}\n\`\`\`\n`;
        const ta = textareaRef.current;
        if (ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const newValue = value.slice(0, start) + block + value.slice(end);
          onChange(newValue);
          requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(start, start);
          });
        }
      },
      [value, onChange],
    );

    const handleDrop = useCallback(
      (e: React.DragEvent<HTMLTextAreaElement>) => {
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length === 0) return;

        e.preventDefault();

        const file = droppedFiles[0];
        if (file.size > 5 * 1024 * 1024) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (!text) return;

          if (onSmartPaste) {
            const ext = file.name.split(".").pop()?.toLowerCase() || "";
            if (ext === "md" || ext === "mdx" || ext === "txt") {
              onSmartPaste(text.trim());
            } else {
              const lang = detectCodeLanguage(text) || ext || "text";
              const block = `\n## ${file.name}\n\n\`\`\`${lang}\n${text.trimEnd()}\n\`\`\`\n`;
              onSmartPaste(block);
            }
          }
        };
        reader.readAsText(file);
      },
      [onSmartPaste],
    );

    return (
      <div className="flex-1 relative bg-background group h-full">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center overflow-hidden">
          <Code2 className="w-160 h-160 text-primary rotate-12 transition-transform duration-700 group-focus-within:scale-110" />
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          placeholder={placeholder || t("editor.placeholder")}
          spellCheck={false}
          className="w-full h-full bg-transparent p-12 font-mono text-[13px] md:text-sm leading-relaxed outline-none resize-none text-foreground placeholder:text-muted-foreground/20 selection:bg-primary/20 relative z-10 custom-scrollbar"
        />

        <div className="absolute bottom-6 left-10 flex gap-8 text-[9px] font-mono text-muted-foreground uppercase tracking-[0.3em] pointer-events-none z-20 opacity-50">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t("editor.lines")}: {value.split("\n").length}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t("editor.words")}: {value.trim() ? value.trim().split(/\s+/).length : 0}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary" />
            {t("editor.buffer")}: {new Blob([value]).size} bytes
          </div>
        </div>
      </div>
    );
  },
);

CodeEditor.displayName = "CodeEditor";
