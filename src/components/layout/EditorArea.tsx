import { type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Code2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeEditor, type CodeEditorHandle } from "@/components/editor/CodeEditor";
import { MarkdownToolbar } from "@/components/editor/MarkdownToolbar";
import { SearchBar } from "@/components/editor/SearchBar";
import { MarkdownPreview } from "@/components/preview/MarkdownPreview";
import { TableOfContents } from "@/components/preview/TableOfContents";
import type { ViewMode } from "@/lib/constants";

interface EditorAreaProps {
  content: string;
  viewMode: ViewMode;
  isMobile: boolean;
  showSearch: boolean;
  showToc: boolean;
  editorRef: RefObject<CodeEditorHandle | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onContentChange: (value: string) => void;
  onSmartPaste: (markdown: string) => void;
  onTocNavigate: (id: string) => void;
  onCloseSearch: () => void;
}

export const EditorArea = ({
  content,
  viewMode,
  isMobile,
  showSearch,
  showToc,
  editorRef,
  textareaRef,
  onContentChange,
  onSmartPaste,
  onTocNavigate,
  onCloseSearch,
}: EditorAreaProps) => {
  const { t } = useTranslation();

  const editorBlock = (
    <>
      <MarkdownToolbar value={content} onChange={onContentChange} textareaRef={textareaRef!} />
      {showSearch && textareaRef && (
        <SearchBar value={content} textareaRef={textareaRef} onClose={onCloseSearch} />
      )}
      <CodeEditor
        ref={editorRef}
        value={content}
        onChange={onContentChange}
        placeholder={t("editor.placeholder")}
        onSmartPaste={onSmartPaste}
      />
    </>
  );

  const previewBlock = (
    <div className="flex-1 min-w-0 flex">
      <MarkdownPreview content={content} />
      {showToc && <TableOfContents content={content} onNavigate={onTocNavigate} />}
    </div>
  );

  if (isMobile) {
    return (
      <Tabs defaultValue="editor" className="flex-1 flex flex-col">
        <TabsList variant="line" className="w-full justify-start px-4 shrink-0">
          <TabsTrigger value="editor" className="gap-1.5">
            <Code2 className="w-3 h-3" />
            {t("editorArea.editor")}
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <Eye className="w-3 h-3" />
            {t("editorArea.preview")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="flex-1 min-h-0 flex flex-col">
          {editorBlock}
        </TabsContent>
        <TabsContent value="preview" className="flex-1 min-h-0">
          {previewBlock}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <>
      {(viewMode === "split" || viewMode === "editor") && (
        <div className="flex-1 min-w-0 flex flex-col border-r border-border/20">
          {editorBlock}
        </div>
      )}
      {(viewMode === "split" || viewMode === "preview") && previewBlock}
    </>
  );
};
