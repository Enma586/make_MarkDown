import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import type { Components } from "react-markdown";
import { cleanReadme } from "@/lib/file-utils";

interface MarkdownPreviewProps {
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}

function preprocessContent(content: string): string {
  let cleaned = cleanReadme(content);
  cleaned = cleaned.replace(/<a\s+[^>]*>\s*<img[^>]*>\s*<\/a>/gi, "");
  cleaned = cleaned.replace(/<img[^>]*>/gi, "");
  return cleaned;
}

const components: Components = {
  h1: ({ children }) => {
    const text = String(children).replace(/<[^>]*>/g, "");
    return <h1 id={slugify(text)}>{children}</h1>;
  },
  h2: ({ children }) => {
    const text = String(children).replace(/<[^>]*>/g, "");
    return <h2 id={slugify(text)}>{children}</h2>;
  },
  h3: ({ children }) => {
    const text = String(children).replace(/<[^>]*>/g, "");
    return <h3 id={slugify(text)}>{children}</h3>;
  },
  h4: ({ children }) => {
    const text = String(children).replace(/<[^>]*>/g, "");
    return <h4 id={slugify(text)}>{children}</h4>;
  },
};

export const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const { t } = useTranslation();

  if (!content.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
          <FileText className="w-12 h-12" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em]">
            {t("preview.placeholder")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar" id="preview-scroll">
      <article className="prose-docu">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {preprocessContent(content)}
        </ReactMarkdown>
      </article>
    </div>
  );
};
