import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link,
  List,
  ListOrdered,
  Quote,
  Table,
  Minus,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarkdownToolbarProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  action: () => void;
  separator?: boolean;
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  before: string,
  after: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || "text";
  const replacement = `${before}${selected}${after}`;

  onChange(value.slice(0, start) + replacement + value.slice(end));

  requestAnimationFrame(() => {
    textarea.focus();
    const cursorOffset = start + before.length + selected.length;
    textarea.setSelectionRange(
      start + before.length,
      cursorOffset,
    );
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  value: string,
  text: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  onChange(value.slice(0, start) + text + value.slice(start));

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);
  });
}

function insertBlock(
  textarea: HTMLTextAreaElement,
  value: string,
  block: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const before = value.slice(0, start);
  const needsNewline = before.length > 0 && !before.endsWith("\n");
  const prefix = needsNewline ? "\n" : "";
  insertAtCursor(textarea, value, `${prefix}${block}\n`, onChange);
}

export const MarkdownToolbar = ({
  value,
  onChange,
  textareaRef,
}: MarkdownToolbarProps) => {
  const { t } = useTranslation();

  const exec = useCallback(
    (fn: (ta: HTMLTextAreaElement, v: string) => void) => {
      const ta = textareaRef.current;
      if (ta) fn(ta, value);
    },
    [textareaRef, value],
  );

  const actions: ToolbarAction[] = [
    {
      icon: <Heading1 className="w-3.5 h-3.5" />,
      label: t("toolbar.h1"),
      shortcut: "Ctrl+1",
      action: () => exec((ta, v) => insertBlock(ta, v, "# ", onChange)),
    },
    {
      icon: <Heading2 className="w-3.5 h-3.5" />,
      label: t("toolbar.h2"),
      shortcut: "Ctrl+2",
      action: () => exec((ta, v) => insertBlock(ta, v, "## ", onChange)),
    },
    {
      icon: <Heading3 className="w-3.5 h-3.5" />,
      label: t("toolbar.h3"),
      shortcut: "Ctrl+3",
      action: () => exec((ta, v) => insertBlock(ta, v, "### ", onChange)),
      separator: true,
    },
    {
      icon: <Bold className="w-3.5 h-3.5" />,
      label: t("toolbar.bold"),
      shortcut: "Ctrl+B",
      action: () => exec((ta, v) => wrapSelection(ta, v, "**", "**", onChange)),
    },
    {
      icon: <Italic className="w-3.5 h-3.5" />,
      label: t("toolbar.italic"),
      shortcut: "Ctrl+I",
      action: () => exec((ta, v) => wrapSelection(ta, v, "*", "*", onChange)),
    },
    {
      icon: <Strikethrough className="w-3.5 h-3.5" />,
      label: t("toolbar.strikethrough"),
      shortcut: "Ctrl+Shift+X",
      action: () =>
        exec((ta, v) => wrapSelection(ta, v, "~~", "~~", onChange)),
      separator: true,
    },
    {
      icon: <Code className="w-3.5 h-3.5" />,
      label: t("toolbar.inlineCode"),
      shortcut: "Ctrl+E",
      action: () => exec((ta, v) => wrapSelection(ta, v, "`", "`", onChange)),
    },
    {
      icon: <FileCode className="w-3.5 h-3.5" />,
      label: t("toolbar.codeBlock"),
      shortcut: "Ctrl+Shift+E",
      action: () =>
        exec((ta, v) =>
          insertBlock(ta, v, "```\ncode\n```", onChange),
        ),
      separator: true,
    },
    {
      icon: <Link className="w-3.5 h-3.5" />,
      label: t("toolbar.link"),
      shortcut: "Ctrl+K",
      action: () =>
        exec((ta, v) => wrapSelection(ta, v, "[", "](url)", onChange)),
    },
    {
      icon: <Quote className="w-3.5 h-3.5" />,
      label: t("toolbar.blockquote"),
      shortcut: "Ctrl+Shift+Q",
      action: () => exec((ta, v) => insertBlock(ta, v, "> ", onChange)),
      separator: true,
    },
    {
      icon: <List className="w-3.5 h-3.5" />,
      label: t("toolbar.bulletList"),
      shortcut: "Ctrl+Shift+8",
      action: () => exec((ta, v) => insertBlock(ta, v, "- ", onChange)),
    },
    {
      icon: <ListOrdered className="w-3.5 h-3.5" />,
      label: t("toolbar.numberedList"),
      shortcut: "Ctrl+Shift+7",
      action: () => exec((ta, v) => insertBlock(ta, v, "1. ", onChange)),
      separator: true,
    },
    {
      icon: <Table className="w-3.5 h-3.5" />,
      label: t("toolbar.table"),
      shortcut: "",
      action: () =>
        exec((ta, v) =>
          insertBlock(
            ta,
            v,
            "| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |",
            onChange,
          ),
        ),
    },
    {
      icon: <Minus className="w-3.5 h-3.5" />,
      label: t("toolbar.hr"),
      shortcut: "",
      action: () => exec((ta, v) => insertBlock(ta, v, "---", onChange)),
    },
  ];

  return (
    <div className="shrink-0 flex items-center gap-0.5 px-2 py-1 border-b border-border/20 bg-muted/20 overflow-x-auto">
      {actions.map((a, i) => (
        <div key={i} className="flex items-center">
          {a.separator && (
            <Separator orientation="vertical" className="h-4 mx-1" />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 shrink-0"
                onClick={a.action}
              >
                {a.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">
              <span>{a.label}</span>
              {a.shortcut && (
                <kbd className="ml-1.5 px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[9px]">
                  {a.shortcut}
                </kbd>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
};
