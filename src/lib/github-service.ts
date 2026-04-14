export interface RepoFile {
  path: string;
  name: string;
  size: number;
  sha: string;
  type: "file" | "dir";
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
}

const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "__pycache__",
  ".venv",
  "vendor",
  ".tox",
  "coverage",
  ".DS_Store",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".env",
  ".env.local",
  ".env.production",
  "go.sum",
  "Cargo.lock",
  "poetry.lock",
  "composer.lock",
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.svg",
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.ico",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.eot",
  "*.mp4",
  "*.mp3",
  "*.zip",
  "*.tar",
  "*.gz",
  "*.bin",
  "*.exe",
  "*.wasm",
];

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "py", "rb", "go", "rs", "java", "kt", "kts", "scala",
  "c", "cpp", "h", "hpp", "cc", "cxx",
  "cs", "php", "swift", "dart", "lua", "r", "R",
  "ex", "exs", "erl", "hrl", "hs",
  "sql", "graphql", "gql", "prisma",
  "sh", "bash", "zsh", "fish", "ps1",
  "yaml", "yml", "toml", "json", "xml",
  "html", "htm", "css", "scss", "sass", "less", "styl",
  "vue", "svelte", "astro",
  "md", "mdx", "txt", "rst", "adoc",
  "tf", "hcl",
  "dockerfile", "Dockerfile",
  "makefile", "Makefile",
  "gitignore", "env",
  "proto", "thrift", "graphql",
]);

function parseGitHubUrl(input: string): RepoInfo | null {
  const trimmed = input.trim().replace(/\/+$/, "");

  let match = trimmed.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+))?$/);
  if (match) {
    return { owner: match[1], repo: match[2], branch: match[3] || "main" };
  }

  match = trimmed.match(/^([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+))?$/);
  if (match) {
    return { owner: match[1], repo: match[2], branch: match[3] || "main" };
  }

  return null;
}

function shouldIgnore(path: string): boolean {
  const parts = path.split("/");
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.startsWith("*")) {
      const ext = pattern.slice(1);
      if (parts[parts.length - 1].endsWith(ext)) return true;
    } else {
      if (parts.includes(pattern)) return true;
    }
  }
  return false;
}

function isCodeFile(path: string): boolean {
  const name = path.split("/").pop() || "";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : name;

  if (CODE_EXTENSIONS.has(ext)) return true;

  const baseName = name.toLowerCase();
  if (["dockerfile", "makefile", "gitignore", "rakefile", "gemfile", "procfile", "vagrantfile"].includes(baseName)) {
    return true;
  }

  return false;
}

export function filterRepoFiles(files: RepoFile[]): RepoFile[] {
  return files.filter((f) => f.type === "file" && !shouldIgnore(f.path) && isCodeFile(f.path));
}

export async function fetchRepoTree(
  repo: RepoInfo,
  token?: string,
): Promise<RepoFile[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (!data.tree) {
    throw new Error("No se encontro el arbol del repositorio. Verifica que el branch existe.");
  }

  return data.tree
    .filter((item: { type: string }) => item.type === "blob" || item.type === "tree")
    .map((item: { path: string; size: number; sha: string; type: string }) => ({
      path: item.path,
      name: item.path.split("/").pop() || item.path,
      size: item.size || 0,
      sha: item.sha,
      type: item.type === "blob" ? "file" as const : "dir" as const,
    }));
}

export async function fetchFileContent(
  repo: RepoInfo,
  filePath: string,
  token?: string,
): Promise<string> {
  const rawUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${filePath}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(rawUrl, { headers });

  if (!res.ok) {
    throw new Error(`No se pudo leer ${filePath}`);
  }

  return res.text();
}

export async function fetchMultipleFiles(
  repo: RepoInfo,
  files: RepoFile[],
  token?: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Array<{ path: string; content: string }>> {
  const results: Array<{ path: string; content: string }> = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const content = await fetchFileContent(repo, files[i].path, token);
      results.push({ path: files[i].path, content });
    } catch {
      errors.push(files[i].path);
    }
    onProgress?.(i + 1, files.length);

    if (i < files.length - 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  if (errors.length > 0) {
    console.warn(`Failed to fetch ${errors.length} files:`, errors);
  }

  return results;
}

export { parseGitHubUrl };
