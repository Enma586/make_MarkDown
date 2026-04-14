import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { GitFork, X, FolderTree, FileCode, Loader2, AlertCircle, Check, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseGitHubUrl, fetchRepoTree, filterRepoFiles, fetchMultipleFiles, type RepoFile } from "@/lib/github-service";
import { repoFilesToMarkdown, isRouteFile, isConfigFile, isDockerfile, generateFileDescription, analyzeDockerfile } from "@/lib/file-utils";
import { structureWithAI, describeFileWithAI } from "@/lib/ai-service";
import type { AISettings } from "@/hooks/use-ai-settings";

interface RepoImporterProps {
  open: boolean;
  onClose: () => void;
  onImport: (markdown: string) => void;
  aiSettings: AISettings;
  aiConfigured: boolean;
}

type Step = "input" | "scanning" | "select" | "processing" | "done";

interface FileNode {
  path: string;
  name: string;
  size: number;
  children: FileNode[];
}

function buildFileTree(files: RepoFile[]): FileNode[] {
  const root: FileNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      let existing = current.find((n) => n.name === dirName && n.children.length > 0);
      if (!existing) {
        existing = { path: parts.slice(0, i + 1).join("/"), name: dirName, size: 0, children: [] };
        current.push(existing);
      }
      current = existing.children;
    }

    current.push({
      path: file.path,
      name: parts[parts.length - 1],
      size: file.size,
      children: [],
    });
  }

  return root;
}

function formatDisplayName(path: string): string {
  const parts = path.split("/");
  if (parts.length <= 2) return path;

  const fileName = parts[parts.length - 1];
  const parentDir = parts[parts.length - 2];
  const grandparent = parts.length > 2 ? parts[parts.length - 3] : "";

  if (grandparent) {
    return `${grandparent}/${parentDir}/${fileName}`;
  }
  return `${parentDir}/${fileName}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FileTreeNode({
  node,
  depth,
  selected,
  onToggle,
  onSelect,
  t,
}: {
  node: FileNode;
  depth: number;
  selected: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isDir = node.children.length > 0;
  const [open, setOpen] = useState(depth < 1);
  const isSelected = selected.has(node.path);
  const isAllChildrenSelected = isDir && node.children.every((c) => selected.has(c.path));

  return (
    <div>
      <button
        onClick={() => isDir ? setOpen(!open) : onSelect(node.path)}
        className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/50 text-left group"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isDir ? (
          open ? <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="text-[11px] truncate" title={node.path}>
          {isDir ? (
            <span className="text-muted-foreground">{node.name}/</span>
          ) : (
            <span className={isSelected ? "text-primary" : "text-foreground/70"}>
              {depth > 3 ? formatDisplayName(node.path) : node.name}
            </span>
          )}
        </span>
        {!isDir && (
          <span className="ml-auto text-[9px] font-mono text-muted-foreground/30 shrink-0">{formatBytes(node.size)}</span>
        )}
        {isDir && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              const allPaths = getAllPaths(node);
              const allSelected = allPaths.every((p) => selected.has(p));
              if (allSelected) {
                allPaths.forEach((p) => onSelect(p));
              } else {
                allPaths.forEach((p) => onToggle(p));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                const allPaths = getAllPaths(node);
                const allSelected = allPaths.every((p) => selected.has(p));
                if (allSelected) {
                  allPaths.forEach((p) => onSelect(p));
                } else {
                  allPaths.forEach((p) => onToggle(p));
                }
              }
            }}
            className="ml-auto opacity-0 group-hover:opacity-100 cursor-pointer"
            title={isAllChildrenSelected ? t("repoImporter.deselectFolder") : t("repoImporter.selectFolder")}
          >
            <Check className={`w-3 h-3 ${isAllChildrenSelected ? "text-primary" : "text-muted-foreground/30"}`} />
          </span>
        )}
      </button>
      {isDir && open && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} selected={selected} onToggle={onToggle} onSelect={onSelect} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function getAllPaths(node: FileNode): string[] {
  if (node.children.length === 0) return [node.path];
  return node.children.flatMap(getAllPaths);
}

export const RepoImporter = ({ open, onClose, onImport, aiSettings, aiConfigured }: RepoImporterProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [branch, setBranch] = useState("main");
  const [error, setError] = useState("");
  const [allFiles, setAllFiles] = useState<RepoFile[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [useAI, setUseAI] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    if (open) {
      setStep("input");
      setUrl("");
      setToken("");
      setBranch("main");
      setError("");
      setAllFiles([]);
      setSelectedPaths(new Set());
      setProgress({ done: 0, total: 0 });
      setUseAI(false);
      abortRef.current = false;
    }
  }, [open]);

  const handleScan = async () => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError(t("repoImporter.invalidUrl"));
      return;
    }

    setBranch(parsed.branch);
    setError("");
    setStep("scanning");

    try {
      const tree = await fetchRepoTree({ ...parsed, branch: parsed.branch }, token || undefined);
      const codeFiles = filterRepoFiles(tree);
      setAllFiles(codeFiles);
      setSelectedPaths(new Set(codeFiles.map((f) => f.path)));
      setStep("select");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("repoImporter.scanError"));
      setStep("input");
    }
  };

  const handleToggleFile = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleProcess = async () => {
    if (selectedPaths.size === 0) return;

    setStep("processing");
    const filesToFetch = allFiles.filter((f) => selectedPaths.has(f.path));
    setProgress({ done: 0, total: filesToFetch.length });

    const parsed = parseGitHubUrl(url);
    if (!parsed) return;

    try {
      const fileContents = await fetchMultipleFiles(
        { ...parsed, branch },
        filesToFetch,
        token || undefined,
        (done, total) => setProgress({ done, total }),
      );

      if (abortRef.current) return;

      const mappedFiles = fileContents.map(f => ({ name: f.path, content: f.content }));

      let fullMarkdown: string;

      if (useAI && aiConfigured) {
        const descriptions = new Map<string, string>();

        for (let i = 0; i < mappedFiles.length; i++) {
          if (abortRef.current) return;

          const file = mappedFiles[i];

          if (isRouteFile(file.name, file.content) || isConfigFile(file.name)) {
            setProgress({ done: i + 1, total: mappedFiles.length });
            continue;
          }

          if (isDockerfile(file.name)) {
            try {
              const analysis = await structureWithAI(file.content, file.name, aiSettings);
              descriptions.set(file.name, `#### \`${file.name}\`\n${analysis}`);
            } catch {
              descriptions.set(file.name, analyzeDockerfile(file.content, file.name));
            }
          } else {
            try {
              const desc = await describeFileWithAI(file.content, file.name, aiSettings);
              descriptions.set(file.name, `**Proposito:** ${desc.trim()}`);
            } catch {
              descriptions.set(file.name, generateFileDescription(file.content, file.name));
            }
          }
          setProgress({ done: i + 1, total: mappedFiles.length });
        }

        fullMarkdown = repoFilesToMarkdown(mappedFiles, parsed.repo, parsed.owner, descriptions);
      } else {
        fullMarkdown = repoFilesToMarkdown(mappedFiles, parsed.repo, parsed.owner);
      }

      if (!fullMarkdown.trim()) {
        throw new Error("No se pudo generar documentacion. Verifica que los archivos contengan codigo.");
      }

      onImport(fullMarkdown);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("repoImporter.processError"));
      setStep("select");
    }
  };

  const handleClose = () => {
    abortRef.current = true;
    onClose();
  };

  if (!open) return null;

  const tree = buildFileTree(allFiles);
  const parsedUrl = parseGitHubUrl(url);

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
          className="w-full max-w-2xl mx-4 bg-background border border-border/40 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("repoImporter.title")}</h2>
            </div>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-5 flex flex-col gap-4 min-h-[400px]">
            {step === "input" && (
              <>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                      {t("repoImporter.url")}
                    </label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t("repoImporter.urlPlaceholder")}
                      className="h-9 text-xs font-mono"
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                        {t("repoImporter.branch")}
                      </label>
                      <Input
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder={t("repoImporter.branchPlaceholder")}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                        {t("repoImporter.token")}
                      </label>
                      <Input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={t("repoImporter.tokenPlaceholder")}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-[11px] text-destructive/80">{error}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button className="text-xs gap-1.5" onClick={handleScan}>
                    <FolderTree className="w-3.5 h-3.5" />
                    {t("repoImporter.scan")}
                  </Button>
                </div>
              </>
            )}

            {step === "scanning" && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    {t("repoImporter.scanning", { owner: parsedUrl?.owner, repo: parsedUrl?.repo })}
                  </span>
                </div>
              </div>
            )}

            {step === "select" && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">
                      {parsedUrl?.owner}/{parsedUrl?.repo}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground/40">
                      {t("repoImporter.filesSelected", { selected: selectedPaths.size, total: allFiles.length })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPaths(new Set(allFiles.map((f) => f.path)))}
                      className="text-[9px] font-mono text-primary hover:underline"
                    >
                      {t("repoImporter.selectAll")}
                    </button>
                    <button
                      onClick={() => setSelectedPaths(new Set())}
                      className="text-[9px] font-mono text-muted-foreground hover:underline"
                    >
                      {t("repoImporter.none")}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      disabled={!aiConfigured}
                      className="rounded"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {t("repoImporter.useAI")}
                      {!aiConfigured && <span className="text-destructive ml-1">{t("repoImporter.useAINote")}</span>}
                    </span>
                  </label>
                  {useAI && aiConfigured && (
                    <span className="text-[9px] font-mono text-muted-foreground/40">
                      {aiSettings.model}
                    </span>
                  )}
                </div>

                <ScrollArea className="h-64 border border-border/30 rounded-lg">
                  <div className="p-1">
                    {tree.map((node) => (
                      <FileTreeNode
                        key={node.path}
                        node={node}
                        depth={0}
                        selected={selectedPaths}
                        onToggle={handleToggleFile}
                        onSelect={handleToggleFile}
                        t={t}
                      />
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={handleClose}>
                    {t("repoImporter.cancel")}
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5" onClick={handleProcess} disabled={selectedPaths.size === 0}>
                    <FileCode className="w-3.5 h-3.5" />
                    {t("repoImporter.process", { count: selectedPaths.size })}
                  </Button>
                </div>
              </>
            )}

            {step === "processing" && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <div className="w-full">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
                      <span>{useAI ? t("repoImporter.processing") : t("repoImporter.downloading")}</span>
                      <span>{progress.done}/{progress.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress.done / progress.total) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px]" onClick={handleClose}>
                    {t("repoImporter.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Check className="w-8 h-8 text-green-500" />
                  <span className="text-sm font-semibold">{t("repoImporter.done")}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t("repoImporter.filesProcessed", { count: selectedPaths.size })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
