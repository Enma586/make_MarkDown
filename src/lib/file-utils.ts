const LANG_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  ps1: "powershell",
  yaml: "yaml",
  yml: "yaml",
  json: "json",
  toml: "toml",
  xml: "xml",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  md: "markdown",
  mdx: "mdx",
  txt: "text",
  dockerfile: "dockerfile",
  env: "bash",
  gitignore: "text",
  tf: "hcl",
  graphql: "graphql",
  gql: "graphql",
  vue: "vue",
  svelte: "svelte",
  lua: "lua",
  r: "r",
  dart: "dart",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hs: "haskell",
  scala: "scala",
  clj: "clojure",
};

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  if (parts.length > 1) return parts[parts.length - 1];
  return filename.toLowerCase();
}

function getLanguage(filename: string): string {
  const ext = getExtension(filename);
  return LANG_MAP[ext] || ext;
}

export function detectCodeLanguage(text: string): string | null {
  const patterns: Array<{ regex: RegExp; lang: string }> = [
    { regex: /^\s*(import\s+.*\s+from\s+['"]|export\s+(default\s+)?(function|const|class|async)|require\s*\()/m, lang: "typescript" },
    { regex: /^\s*(import\s+.*\s+from\s+['"]|export\s+|interface\s+\w+|type\s+\w+\s*=)/m, lang: "typescript" },
    { regex: /^\s*(def\s+\w+|import\s+\w+|from\s+\w+\s+import|class\s+\w+|if\s+__name__)/m, lang: "python" },
    { regex: /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/mi, lang: "sql" },
    { regex: /^\s*(func\s+\w+|package\s+\w+|import\s+\(|fmt\.|log\.)/m, lang: "go" },
    { regex: /^\s*(fn\s+\w+|let\s+mut\s|use\s+\w+|pub\s+fn|impl\s)/m, lang: "rust" },
    { regex: /^\s*(function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|console\.log)/m, lang: "javascript" },
    { regex: /^\s*{\s*\n/m, lang: "json" },
    { regex: /^\s*\w+:\s*\n/m, lang: "yaml" },
    { regex: /^\s*(<!DOCTYPE|<html|<div|<span|<head|<body)/mi, lang: "html" },
    { regex: /^\s*(public\s+class|private\s+|protected\s+|System\.out)/m, lang: "java" },
    { regex: /^\s*(FROM|RUN|COPY|WORKDIR|CMD|ENTRYPOINT|EXPOSE)\s/m, lang: "dockerfile" },
  ];

  for (const { regex, lang } of patterns) {
    if (regex.test(text)) return lang;
  }

  return null;
}

interface CodeSection {
  heading: string;
  code: string;
}

function splitByRegex(lines: string[], regex: RegExp, labelFn: (m: RegExpMatchArray) => string): CodeSection[] {
  const sections: CodeSection[] = [];
  let current: string[] = [];
  let currentHeading = "";

  for (const line of lines) {
    const match = line.match(regex);
    if (match && current.length > 0) {
      sections.push({ heading: currentHeading, code: current.join("\n") });
      current = [];
      currentHeading = labelFn(match);
    } else if (match && current.length === 0) {
      currentHeading = labelFn(match);
    }
    current.push(line);
  }

  if (current.length > 0) {
    sections.push({ heading: currentHeading, code: current.join("\n") });
  }

  return sections;
}

function extractName(line: string): string {
  const m = line.match(/(?:function|def|fn|func|class|interface|type|const|let|var|export)\s+(\w+)/);
  return m ? m[1] : line.trim().slice(0, 50);
}

function parseTSJS(lines: string[]): CodeSection[] {
  const sections: CodeSection[] = [];
  let current: string[] = [];
  let currentHeading = "Setup";
  let braceDepth = 0;
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();

    const isBlockStart = /^(export\s+(default\s+)?)?(function|class|interface|type|enum|const|let|var)\s+\w+/.test(trimmed) ||
      /^(export\s+)?(async\s+)?\w+\s*=/.test(trimmed);

    if (isBlockStart && current.length > 0 && braceDepth <= 0) {
      sections.push({ heading: currentHeading, code: current.join("\n") });
      current = [];
      currentHeading = extractName(trimmed);
      started = false;
    } else if (isBlockStart && current.length === 0) {
      currentHeading = extractName(trimmed);
      started = false;
    }

    current.push(line);

    for (const ch of line) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth > 0) started = true;
    if (started && braceDepth <= 0 && line.includes("}")) {
      started = false;
    }
  }

  if (current.length > 0) {
    sections.push({ heading: currentHeading, code: current.join("\n") });
  }

  return sections;
}

function parsePython(lines: string[]): CodeSection[] {
  const sections: CodeSection[] = [];
  let current: string[] = [];
  let currentHeading = "Setup";
  let prevIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(def |class |@)/.test(trimmed)) {
      const indent = line.search(/\S/);
      if (current.length > 0 && indent <= prevIndent && prevIndent >= 0) {
        sections.push({ heading: currentHeading, code: current.join("\n") });
        current = [];
      } else if (current.length > 0 && indent === 0) {
        sections.push({ heading: currentHeading, code: current.join("\n") });
        current = [];
      }
      currentHeading = extractName(trimmed);
      prevIndent = indent;
    }

    current.push(line);
  }

  if (current.length > 0) {
    sections.push({ heading: currentHeading, code: current.join("\n") });
  }

  return sections;
}

function parseGo(lines: string[]): CodeSection[] {
  const sections: CodeSection[] = [];
  let current: string[] = [];
  let currentHeading = "Package & Imports";
  let braceDepth = 0;
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(func |type |var |const )\w+/.test(trimmed) && current.length > 0 && braceDepth <= 0) {
      sections.push({ heading: currentHeading, code: current.join("\n") });
      current = [];
      currentHeading = extractName(trimmed);
      started = false;
    } else if (/^(func |type |var |const )\w+/.test(trimmed) && current.length === 0) {
      currentHeading = extractName(trimmed);
      started = false;
    }

    current.push(line);

    for (const ch of line) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth > 0) started = true;
    if (started && braceDepth <= 0 && line.includes("}")) {
      started = false;
    }
  }

  if (current.length > 0) {
    sections.push({ heading: currentHeading, code: current.join("\n") });
  }

  return sections;
}

function parseRust(lines: string[]): CodeSection[] {
  const sections: CodeSection[] = [];
  let current: string[] = [];
  let currentHeading = "Imports";
  let braceDepth = 0;
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(pub\s+)?(fn|struct|enum|impl|trait|mod|const|static)\s+\w+/.test(trimmed) && current.length > 0 && braceDepth <= 0) {
      sections.push({ heading: currentHeading, code: current.join("\n") });
      current = [];
      currentHeading = extractName(trimmed);
      started = false;
    } else if (/^(pub\s+)?(fn|struct|enum|impl|trait|mod|const|static)\s+\w+/.test(trimmed) && current.length === 0) {
      currentHeading = extractName(trimmed);
      started = false;
    }

    current.push(line);

    for (const ch of line) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth > 0) started = true;
    if (started && braceDepth <= 0 && line.includes("}")) {
      started = false;
    }
  }

  if (current.length > 0) {
    sections.push({ heading: currentHeading, code: current.join("\n") });
  }

  return sections;
}

function parseSQL(lines: string[]): CodeSection[] {
  const sections: CodeSection[] = [];
  let current: string[] = [];
  let currentHeading = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|WITH|GRANT|REVOKE)\s/i.test(trimmed) && current.length > 0) {
      sections.push({ heading: currentHeading, code: current.join("\n") });
      current = [];
    }

    if (/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|WITH|GRANT|REVOKE)\s/i.test(trimmed)) {
      const m = trimmed.match(/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|WITH)\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:TABLE|INDEX|FUNCTION|PROCEDURE|VIEW|TRIGGER|SEQUENCE|SCHEMA|DATABASE|USER|ROLE)?\s*(?:IF\s+NOT\s+EXISTS\s+)?(\w+)?/i);
      currentHeading = m ? `${m[1]} ${m[2] || ""}`.trim() : trimmed.slice(0, 40);
    }

    current.push(line);

    if (trimmed.endsWith(";")) {
      if (current.length > 0) {
        sections.push({ heading: currentHeading, code: current.join("\n") });
        current = [];
        currentHeading = "";
      }
    }
  }

  if (current.length > 0) {
    sections.push({ heading: currentHeading, code: current.join("\n") });
  }

  return sections;
}

function smartSplit(content: string, lang: string): CodeSection[] {
  const lines = content.split("\n");
  const MAX_LINES = 200;

  if (lines.length <= MAX_LINES) {
    return [{ heading: "Code", code: content }];
  }

  switch (lang) {
    case "typescript":
    case "javascript":
    case "tsx":
    case "jsx":
    case "java":
    case "kotlin":
    case "csharp":
    case "php":
      return parseTSJS(lines);
    case "python":
      return parsePython(lines);
    case "go":
      return parseGo(lines);
    case "rust":
      return parseRust(lines);
    case "sql":
      return parseSQL(lines);
    default:
      return splitByRegex(lines, /^(?:function|def|fn|func|class|interface|type|pub\s+fn|pub\s+struct|pub\s+enum)\s+/m, (m) => extractName(m[0]));
  }
}

function sectionsToMarkdown(sections: CodeSection[], lang: string, filename: string): string {
  if (sections.length === 1) {
    return `## ${filename}\n\n\`\`\`${lang}\n${sections[0].code.trimEnd()}\n\`\`\``;
  }

  const parts = sections.map((s, i) => {
    const heading = s.heading || `Section ${i + 1}`;
    return `### ${heading}\n\n\`\`\`${lang}\n${s.code.trimEnd()}\n\`\`\``;
  });

  return `## ${filename}\n\n${parts.join("\n\n")}`;
}

export function smartStructure(content: string, filename: string): string {
  const lang = getLanguage(filename);
  const lines = content.split("\n");
  const totalLines = lines.length;
  const totalBytes = new Blob([content]).size;

  const header = `# ${filename}\n\n> Auto-generated documentation from source file.\n\n| Property | Value |\n|----------|-------|\n| Language | \`${lang}\` |\n| Lines | ${totalLines} |\n| Size | ${formatBytes(totalBytes)} |\n| Sections | ${totalLines > 60 ? "Auto-split" : "Single block"} |\n\n---\n\n`;

  const ext = getExtension(filename);

  if (ext === "md" || ext === "mdx" || ext === "txt") {
    return cleanReadme(content).trim();
  }

  if (ext === "json") {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      return header + `## ${filename}\n\n\`\`\`json\n${formatted}\n\`\`\``;
    } catch {
      return header + `## ${filename}\n\n\`\`\`${lang}\n${content.trimEnd()}\n\`\`\``;
    }
  }

  const sections = smartSplit(content, lang);
  return header + sectionsToMarkdown(sections, lang, filename);
}

export function fileToMarkdown(filename: string, rawContent: string): string {
  return smartStructure(rawContent, filename);
}

export function filesToMarkdown(files: Array<{ name: string; content: string }>): string {
  if (files.length === 0) return "";

  if (files.length === 1) {
    return fileToMarkdown(files[0].name, files[0].content);
  }

  const title = `# Documentation — ${files.length} files\n\n> Auto-generated from source files.\n\n---\n\n`;
  const sections = files.map((f) => fileToMarkdown(f.name, f.content));
  return title + sections.join("\n\n---\n\n");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export const SUPPORTED_EXTENSIONS = Object.keys(LANG_MAP);

export function cleanReadme(content: string): string {
  let cleaned = content;

  cleaned = cleaned.replace(/<p\s+align\s*=\s*["']center["'][^>]*>[\s\S]*?<\/p>/gi, "");

  cleaned = cleaned.replace(/<a\s+[^>]*href\s*=\s*["'](?:https?:\/\/github\.com\/[^"']*\/actions|https?:\/\/packagist\.org\/packages\/[^"']*|https?:\/\/img\.shields\.io\/[^"']*|https?:\/\/badge\.fury\.io\/[^"']*|https?:\/\/travis-ci\.org\/[^"']*|https?:\/\/circleci\.com\/[^"']*|https?:\/\/codecov\.io\/[^"']*|https?:\/\/coveralls\.io\/[^"']*|https?:\/\/snyk\.io\/[^"']*|https?:\/\/www\.codacy\.com\/[^"']*|https?:\/\/app\.fossa\.io\/[^"']*)[^>]*>\s*<img[^>]*>\s*<\/a>/gi, "");

  cleaned = cleaned.replace(/<img[^>]+src\s*=\s*["'][^"']*(?:shields\.io|badge\.fury|travis-ci|circleci|codecov|coveralls|snyk|codacy|fossa|badgen|badges|gitter)[^"']*["'][^>]*>/gi, "");

  cleaned = cleaned.replace(/<img[^>]+alt\s*=\s*["'][^"']*(?:Build Status|Total Downloads|Latest Stable Version|License|Coverage|CI|CDN|npm version|PyPI version|Go Report|Docker Pulls)[^"']*["'][^>]*>/gi, "");

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export function extractEssentialCode(content: string, lang: string): string {
  const lines = content.split("\n");
  const essential: string[] = [];

  const patterns: Record<string, RegExp> = {
    typescript: /^\s*(export\s+(default\s+)?)?(function|class|interface|type|enum|const|let|var|async\s+function)\s+/,
    javascript: /^\s*(export\s+(default\s+)?)?(function|class|const|let|var|async\s+function)\s+/,
    python: /^\s*(def |class |@|async\s+def )/,
    go: /^\s*(func |type |var |const |interface )/,
    rust: /^\s*(pub\s+)?(fn |struct |enum |impl |trait |mod |const |static |type )/,
    java: /^\s*(public\s+|private\s+|protected\s+)?(class |interface |enum |abstract |@)/,
    php: /^\s*(function |class |interface |trait |namespace |use )/,
    ruby: /^\s*(def |class |module |attr_)/,
    kotlin: /^\s*(fun |class |interface |object |enum |data class |sealed )/,
    swift: /^\s*(func |class |struct |enum |protocol |extension |import )/,
    csharp: /^\s*(public\s+|private\s+|protected\s+|internal\s+)?(class |interface |struct |enum |void |async )/,
    sql: /^\s*(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|WITH|GRANT|REVOKE)\s/i,
    dockerfile: /^\s*(FROM|RUN|COPY|WORKDIR|CMD|ENTRYPOINT|EXPOSE|ARG|ENV|VOLUME|ADD|LABEL|HEALTHCHECK|ONBUILD|STOPSIGNAL|SHELL|USER)\s/i,
  };

  const pattern = patterns[lang] || patterns["typescript"];

  let inBlock = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      if (inBlock) essential.push(line);
      continue;
    }

    if (pattern.test(line) && !inBlock) {
      inBlock = true;
      braceDepth = 0;
    }

    if (inBlock) {
      essential.push(line);
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }

      if (lang === "python" || lang === "ruby") {
        const nextLine = lines[i + 1];
        if (nextLine && /^\S/.test(nextLine) && braceDepth <= 0) {
          inBlock = false;
        }
      } else if (braceDepth <= 0 && line.includes("}") || (trimmed.endsWith(";") && braceDepth <= 0)) {
        inBlock = false;
      }
    }
  }

  if (essential.length === 0) {
    const maxLines = 150;
    return lines.slice(0, maxLines).join("\n");
  }

  return essential.join("\n");
}

// === Repo documentation generation ===

const LIBRARY_FILE_PATTERNS = [
  /\/components\/ui\//,
  /node_modules\//,
  /\.generated\./,
  /\.auto\./,
  /\/dist\//,
  /\/build\//,
  /\/vendor\//,
  /\/__snapshots__\//,
  /\.stories\./,
  /\.test\./,
  /\.spec\./,
  /\.d\.ts$/,
];

export function shouldExcludeFromDocs(path: string): boolean {
  for (const pattern of LIBRARY_FILE_PATTERNS) {
    if (pattern.test(path)) return true;
  }
  return false;
}

function groupFilesByDirectory(files: Array<{ name: string; content: string }>): Map<string, Array<{ name: string; content: string }>> {
  const groups = new Map<string, Array<{ name: string; content: string }>>();

  for (const file of files) {
    const parts = file.name.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir)!.push(file);
  }

  return groups;
}

function generateToc(sections: Array<{ title: string; depth: number }>): string {
  return sections.map((s) => {
    const indent = "  ".repeat(s.depth - 2);
    const slug = slugifyToc(s.title);
    return `${indent}- [${s.title}](#${slug})`;
  }).join("\n");
}

function slugifyToc(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function summarizeConfig(configFiles: Array<{ name: string; content: string }>): string {
  if (configFiles.length === 0) return "";

  const rows = configFiles.map((f) => {
    const baseName = f.name.split("/").pop() || f.name;
    const ext = baseName.includes(".") ? baseName.split(".").pop()! : "";
    let summary = "";

    if (baseName === "package.json") {
      try {
        const pkg = JSON.parse(f.content);
        const deps = Object.keys(pkg.dependencies || {}).length;
        const devDeps = Object.keys(pkg.devDependencies || {}).length;
        summary = `${deps} deps, ${devDeps} devDeps`;
      } catch {
        summary = "Node.js project manifest";
      }
    } else if (baseName.includes("tsconfig")) {
      try {
        const ts = JSON.parse(f.content);
        const target = ts.compilerOptions?.target || "ES2022";
        const strict = ts.compilerOptions?.strict ? "strict" : "no-strict";
        summary = `Target: ${target}, ${strict}`;
      } catch {
        summary = "TypeScript configuration";
      }
    } else if (baseName.includes("eslint")) {
      summary = "ESLint code linting";
    } else if (baseName.includes("prettier")) {
      summary = "Prettier code formatting";
    } else if (baseName.includes("vite.config")) {
      summary = "Vite bundler config";
    } else if (baseName.includes("next.config")) {
      summary = "Next.js framework config";
    } else if (baseName.includes("tailwind")) {
      summary = "Tailwind CSS config";
    } else if (baseName.includes("docker-compose")) {
      summary = "Docker multi-container orchestration";
    } else if (baseName.includes("webpack")) {
      summary = "Webpack bundler config";
    } else if (baseName.includes("jest") || baseName.includes("vitest")) {
      summary = "Test runner config";
    } else if (baseName.includes("components.json")) {
      summary = "shadcn/ui component registry";
    } else if (baseName === ".gitignore") {
      summary = "Git ignored files";
    } else {
      summary = `${getLanguage(baseName)} config`;
    }

    return `| \`${baseName}\` | ${summary} | \`${ext}\` |`;
  });

  return `### Configuracion\n\n| Archivo | Descripcion | Tipo |\n|---------|-------------|------|\n${rows.join("\n")}`;
}

export type DocMode = "compact" | "detailed";

function buildFolderTree(files: string[]): string {
  interface TreeNode {
    name: string;
    children: Map<string, TreeNode>;
    isFile: boolean;
  }

  const root: TreeNode = { name: "", children: new Map(), isFile: false };

  for (const filePath of files) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map(), isFile });
      }
      current = current.children.get(part)!;
    }
  }

  function sortChildren(node: TreeNode): [string, TreeNode][] {
    return Array.from(node.children.entries()).sort(([, a], [, b]) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }

  function renderTree(node: TreeNode, prefix: string, isLast: boolean): string[] {
    const lines: string[] = [];
    const connector = isLast ? "└── " : "├── ";
    const displayName = node.isFile ? node.name : `${node.name}/`;
    lines.push(`${prefix}${connector}${displayName}`);

    const children = sortChildren(node);
    for (let i = 0; i < children.length; i++) {
      const [, child] = children[i];
      const childIsLast = i === children.length - 1;
      const childPrefix = isLast ? "    " : "│   ";
      lines.push(...renderTree(child, prefix + childPrefix, childIsLast));
    }

    return lines;
  }

  const topChildren = sortChildren(root);
  const allLines: string[] = [];
  for (let i = 0; i < topChildren.length; i++) {
    const [, child] = topChildren[i];
    allLines.push(...renderTree(child, "", i === topChildren.length - 1));
  }

  return allLines.join("\n");
}

export function isRouteFile(filename: string, content: string): boolean {
  const name = filename.toLowerCase();

  const namePatterns = [
    /routes?\.([jt]sx?|mjs)$/,
    /router\.([jt]sx?|mjs)$/,
    /api\.([jt]sx?|mjs)$/,
    /controllers?\.([jt]sx?|mjs)$/,
    /handlers?\.([jt]sx?|mjs)$/,
    /endpoints?\.([jt]sx?|mjs)$/,
  ];

  const pathPatterns = [
    /\/routes?\/([jt]sx?|mjs)$/,
    /\/router\//,
    /\/api\//,
    /\/controllers?\//,
    /\/handlers?\//,
    /\/endpoints?\//,
    /\/pages\/api\//,
    /\/app\/api\//,
  ];

  for (const p of namePatterns) {
    if (p.test(name)) return true;
  }
  for (const p of pathPatterns) {
    if (p.test(filename)) return true;
  }

  const contentPatterns = [
    /\.(get|post|put|delete|patch|all|options)\s*\(/,
    /app\.(get|post|put|delete|patch|all)\s*\(/,
    /router\.(get|post|put|delete|patch|all)\s*\(/,
    /fastify\.(get|post|put|delete|patch)/,
  ];

  for (const p of contentPatterns) {
    if (p.test(content)) return true;
  }

  return false;
}

export function isConfigFile(filename: string): boolean {
  const name = filename.toLowerCase();
  const configPatterns = [
    /package\.json$/,
    /tsconfig.*\.json$/,
    /vite\.config\./,
    /next\.config\./,
    /tailwind\.config\./,
    /eslint\.config\./,
    /prettier/,
    /\.env\./,
    /components\.json$/,
    /\.gitignore$/,
    /docker-compose.*\.ya?ml$/,
    /webpack\.config\./,
    /jest\.config\./,
    /vitest\.config\./,
    /\.prettierrc/,
    /babel\.config\./,
    /postcss\.config\./,
    /cargo\.toml$/,
    /go\.mod$/,
    /pyproject\.toml$/,
    /gemfile$/,
    /makefile$/,
  ];

  for (const p of configPatterns) {
    if (p.test(name)) return true;
  }

  return false;
}

export function isDockerfile(filename: string): boolean {
  const name = filename.toLowerCase();
  return /^dockerfile$/.test(name) || /^dockerfile\./.test(name) || /\.dockerfile$/.test(name);
}

export function analyzeDockerfile(content: string, filename: string): string {
  const lines = content.split("\n");
  const stages: { name: string; from: string; instructions: Map<string, string[]> }[] = [];
  let currentStage: { name: string; from: string; instructions: Map<string, string[]> } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed) continue;

    const fromMatch = trimmed.match(/^FROM\s+(\S+)(?:\s+AS\s+(\S+))?/i);
    if (fromMatch) {
      if (currentStage) stages.push(currentStage);
      currentStage = {
        name: fromMatch[2] || (stages.length === 0 ? "build" : `stage-${stages.length + 1}`),
        from: fromMatch[1],
        instructions: new Map(),
      };
      continue;
    }

    if (currentStage) {
      const instruction = trimmed.match(/^(\w+)\s+(.*)/i);
      if (instruction) {
        const key = instruction[1].toUpperCase();
        const val = instruction[2].trim();
        if (!currentStage.instructions.has(key)) {
          currentStage.instructions.set(key, []);
        }
        currentStage.instructions.get(key)!.push(val);
      }
    }
  }
  if (currentStage) stages.push(currentStage);

  let analysis = `#### \`${filename}\`\n**Analisis detallado:**\n`;

  if (stages.length === 0) {
    analysis += "- No se pudieron detectar etapas en el Dockerfile.\n";
    return analysis;
  }

  analysis += `- **Imagen base:** \`${stages[0].from}\``;

  const baseName = stages[0].from.split(":")[0];
  if (baseName.includes("alpine")) {
    analysis += ` - Ligera, ideal para produccion`;
  } else if (baseName.includes("slim")) {
    analysis += ` - Reducida, buen balance tamano/compatibilidad`;
  } else if (baseName.includes("node")) {
    analysis += ` - Imagen oficial de Node.js`;
  } else if (baseName.includes("python")) {
    analysis += ` - Imagen oficial de Python`;
  } else if (baseName.includes("nginx")) {
    analysis += ` - Servidor web/proxy inverso`;
  }
  analysis += "\n";

  if (stages.length > 1) {
    analysis += `- **Multi-stage build:** ${stages.length} etapas\n`;
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const runCount = (stage.instructions.get("RUN") || []).length;
      const copyCount = (stage.instructions.get("COPY") || []).length + (stage.instructions.get("ADD") || []).length;
      analysis += `  - **Etapa ${i + 1} - ${stage.name}:** \`${stage.from}\``;
      if (runCount > 0 || copyCount > 0) {
        analysis += ` - ${runCount} RUN, ${copyCount} COPY/ADD`;
      }
      analysis += "\n";
    }
  }

  const lastStage = stages[stages.length - 1];

  const exposePorts = lastStage.instructions.get("EXPOSE") || [];
  if (exposePorts.length > 0) {
    analysis += `- **Puerto:** ${exposePorts.join(", ")}\n`;
  }

  const cmds = lastStage.instructions.get("CMD") || [];
  const entrypoints = lastStage.instructions.get("ENTRYPOINT") || [];
  if (entrypoints.length > 0) {
    analysis += `- **EntryPoint:** \`${entrypoints.join(" ")}\`\n`;
  }
  if (cmds.length > 0) {
    analysis += `- **CMD:** \`${cmds.join(" ")}\`\n`;
  }

  const workdirs = lastStage.instructions.get("WORKDIR") || [];
  if (workdirs.length > 0) {
    analysis += `- **Directorio de trabajo:** \`${workdirs[workdirs.length - 1]}\`\n`;
  }

  const envVars = lastStage.instructions.get("ENV") || [];
  if (envVars.length > 0) {
    analysis += `- **Variables de entorno:** ${envVars.length} definidas\n`;
    for (const env of envVars) {
      const [key] = env.split(/\s+/);
      analysis += `  - \`${key}\`\n`;
    }
  }

  const runs = lastStage.instructions.get("RUN") || [];
  if (runs.length > 0) {
    analysis += `- **Dependencias instaladas:**\n`;
    for (const run of runs) {
      const short = run.length > 80 ? run.slice(0, 77) + "..." : run;
      analysis += `  - ${short}\n`;
    }
  }

  const copies = lastStage.instructions.get("COPY") || [];
  const adds = lastStage.instructions.get("ADD") || [];
  if (copies.length > 0 || adds.length > 0) {
    analysis += `- **Archivos copiados:** ${copies.length + adds.length} instrucciones\n`;
  }

  const optimizations: string[] = [];
  if (stages.length > 1) optimizations.push("Multi-stage build para reducir tamano final");
  const users = lastStage.instructions.get("USER") || [];
  if (users.length > 0 && !users.some(u => u === "root")) {
    optimizations.push("Usuario no-root para seguridad");
  }
  const healthchecks = lastStage.instructions.get("HEALTHCHECK") || [];
  if (healthchecks.length > 0) optimizations.push("Healthcheck configurado");
  const args = stages[0].instructions.get("ARG") || [];
  if (args.some(a => a.startsWith("NODE_VERSION") || a.startsWith("PYTHON_VERSION") || a.startsWith("GO_VERSION"))) {
    optimizations.push("Version del runtime parametrizada via ARG");
  }
  if (optimizations.length > 0) {
    analysis += `- **Optimizaciones:** ${optimizations.join(", ")}\n`;
  }

  return analysis;
}

export function generateFileDescription(content: string, filename: string): string {
  const lines = content.split("\n").filter(l => {
    const t = l.trim();
    return t && !t.startsWith("//") && !t.startsWith("#") && !t.startsWith("*") && !t.startsWith("/*");
  });

  if (lines.length === 0) return `**Proposito:** Archivo ${filename}.`;

  const firstMeaningful = lines[0].trim();
  const baseName = filename.split("/").pop()?.replace(/\.\w+$/, "") || "";

  if (/export\s+(default\s+)?function\s+\w+/.test(firstMeaningful) || /export\s+(default\s+)?const\s+\w+\s*=/.test(firstMeaningful)) {
    const nameMatch = firstMeaningful.match(/(?:function|const)\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : "";
    if (/use[A-Z]/.test(name) || filename.includes("hooks/") || filename.startsWith("use-")) {
      return `**Proposito:** Hook personalizado \`${name}\` que gestiona estado y logica reutilizable.`;
    }
    return `**Proposito:** Componente React \`${name}\` que renderiza la interfaz de ${baseName}.`;
  }

  if (/^(export\s+)?(default\s+)?class\s+\w+/.test(firstMeaningful)) {
    const nameMatch = firstMeaningful.match(/class\s+(\w+)/);
    return `**Proposito:** Clase \`${nameMatch?.[1] || baseName}\` que define la estructura y comportamiento de ${baseName}.`;
  }

  if (/^(export\s+)?(interface|type)\s+\w+/.test(firstMeaningful)) {
    return `**Proposito:** Definiciones de tipos e interfaces TypeScript para ${baseName}.`;
  }

  if (/^(export\s+)?async\s+function\s+/.test(firstMeaningful) || /^export\s+function\s+/.test(firstMeaningful)) {
    const nameMatch = firstMeaningful.match(/function\s+(\w+)/);
    return `**Proposito:** Funcion \`${nameMatch?.[1] || baseName}\` que implementa la logica de ${baseName}.`;
  }

  if (/^(export\s+)?const\s+\w+\s*=\s*(\(|async|\{)/.test(firstMeaningful)) {
    const nameMatch = firstMeaningful.match(/const\s+(\w+)/);
    return `**Proposito:** Modulo \`${nameMatch?.[1] || baseName}\` que exporta funcionalidad de ${baseName}.`;
  }

  if (filename.includes("hooks/") || filename.startsWith("use-")) {
    return `**Proposito:** Hook personalizado que encapsula logica reutilizable.`;
  }

  if (filename.includes("services/") || filename.includes("lib/")) {
    return `**Proposito:** Modulo de servicios que proporciona funcionalidad de ${baseName}.`;
  }

  if (filename.includes("utils/") || filename.includes("helpers/")) {
    return `**Proposito:** Funciones utilitarias y helpers para ${baseName}.`;
  }

  if (filename.includes("types/") || filename.includes("interfaces/") || filename.includes("models/")) {
    return `**Proposito:** Definiciones de tipos y modelos de datos para ${baseName}.`;
  }

  if (filename.includes("test") || filename.includes("spec") || filename.includes("__tests__")) {
    return `**Proposito:** Tests unitarios/integracion para ${baseName}.`;
  }

  if (filename.includes("middleware")) {
    return `**Proposito:** Middleware que intercepta y procesa peticiones antes de llegar al controlador.`;
  }

  if (isConfigFile(filename)) {
    return `**Proposito:** Archivo de configuracion de ${baseName}.`;
  }

  return `**Proposito:** Archivo fuente de \`${getLanguage(filename)}\` con logica de ${baseName}.`;
}

export function repoFilesToMarkdown(
  files: Array<{ name: string; content: string }>,
  repoName: string,
  owner?: string,
  aiDescriptions?: Map<string, string>,
  mode: DocMode = "detailed",
): string {
  if (files.length === 0) return "";

  if (mode === "compact") {
    return generateCompactDocs(files, repoName, owner, aiDescriptions);
  }

  return generateDetailedDocs(files, repoName, owner, aiDescriptions);
}

function generateCompactDocs(
  files: Array<{ name: string; content: string }>,
  repoName: string,
  owner?: string,
  aiDescriptions?: Map<string, string>,
): string {
  const tree = buildFolderTree(files.map((f) => f.name));
  const tocSections: Array<{ title: string; depth: number }> = [];

  let md = `# ${repoName}\n\n`;
  if (owner) {
    md += `> Repositorio: [${owner}/${repoName}](https://github.com/${owner}/${repoName})\n\n`;
  }

  md += `## Jerarquia de carpetas\n\n\`\`\`\n${repoName}/\n${tree}\n\`\`\`\n\n`;
  tocSections.push({ title: "Jerarquia de carpetas", depth: 2 });

  const routeFiles: Array<{ name: string; content: string }> = [];
  const dockerFiles: Array<{ name: string; content: string }> = [];
  const configFiles: Array<{ name: string; content: string }> = [];
  const regularFiles: Array<{ name: string; content: string }> = [];

  for (const file of files) {
    if (isDockerfile(file.name)) {
      dockerFiles.push(file);
    } else if (isRouteFile(file.name, file.content)) {
      routeFiles.push(file);
    } else if (isConfigFile(file.name)) {
      configFiles.push(file);
    } else {
      regularFiles.push(file);
    }
  }

  tocSections.push({ title: "Modulos", depth: 2 });

  const dirGroups = groupFilesByDirectory(regularFiles);
  const modulesSection: string[] = [];

  const sortedDirs = Array.from(dirGroups.keys()).sort();
  for (const dir of sortedDirs) {
    const dirFiles = dirGroups.get(dir)!;
    const dirLabel = dir === "." ? "Raiz" : dir;
    tocSections.push({ title: dirLabel, depth: 3 });

    const tableRows = dirFiles.map((file) => {
      const ext = getExtension(file.name);
      const fileName = file.name.split("/").pop() || file.name;
      let description: string;

      if (ext === "md" || ext === "mdx" || ext === "txt") {
        description = "Documentacion/Markdown";
      } else if (aiDescriptions?.has(file.name)) {
        description = aiDescriptions.get(file.name)!.replace(/^\*\*Proposito:\s*\*\*\s*/, "");
      } else {
        description = generateFileDescription(file.content, file.name).replace(/^\*\*Proposito:\s*\*\*\s*/, "");
      }

      return `| \`${fileName}\` | ${description} |`;
    });

    modulesSection.push(`### ${dirLabel}\n\n| Archivo | Descripcion |\n|---------|------------|\n${tableRows.join("\n")}`);
  }

  if (dockerFiles.length > 0) {
    tocSections.push({ title: "Dockerfiles", depth: 2 });
  }
  if (routeFiles.length > 0) {
    tocSections.push({ title: "Rutas / API", depth: 2 });
  }
  if (configFiles.length > 0) {
    tocSections.push({ title: "Configuracion", depth: 2 });
  }

  md += `## Tabla de Contenidos\n\n${generateToc(tocSections)}\n\n---\n\n`;
  md += `## Modulos\n\n${modulesSection.join("\n\n")}\n\n`;

  if (dockerFiles.length > 0) {
    md += `---\n\n## Dockerfiles\n\n`;
    for (const file of dockerFiles) {
      if (aiDescriptions?.has(file.name)) {
        md += `${aiDescriptions.get(file.name)}\n\n`;
      } else {
        md += `${analyzeDockerfile(file.content, file.name)}\n\n`;
      }
    }
  }

  if (routeFiles.length > 0) {
    md += `---\n\n## Rutas / API\n\n`;
    for (const file of routeFiles) {
      const lang = getLanguage(file.name);
      md += `### \`${file.name}\`\n\`\`\`${lang}\n${file.content.trimEnd()}\n\`\`\`\n\n`;
    }
  }

  if (configFiles.length > 0) {
    md += `---\n\n${summarizeConfig(configFiles)}\n\n`;
  }

  return md;
}

function generateDetailedDocs(
  files: Array<{ name: string; content: string }>,
  repoName: string,
  owner?: string,
  aiDescriptions?: Map<string, string>,
): string {
  const tree = buildFolderTree(files.map((f) => f.name));
  const tocSections: Array<{ title: string; depth: number }> = [];

  let md = `# ${repoName}\n\n`;

  if (owner) {
    md += `> Repositorio: [${owner}/${repoName}](https://github.com/${owner}/${repoName})\n\n`;
  }

  md += `## Jerarquia de carpetas\n\n\`\`\`\n${repoName}/\n${tree}\n\`\`\`\n\n`;
  tocSections.push({ title: "Jerarquia de carpetas", depth: 2 });

  const routeFiles: Array<{ name: string; content: string }> = [];
  const dockerFiles: Array<{ name: string; content: string }> = [];
  const configFiles: Array<{ name: string; content: string }> = [];
  const regularFiles: Array<{ name: string; content: string }> = [];

  for (const file of files) {
    if (isDockerfile(file.name)) {
      dockerFiles.push(file);
    } else if (isRouteFile(file.name, file.content)) {
      routeFiles.push(file);
    } else if (isConfigFile(file.name)) {
      configFiles.push(file);
    } else {
      regularFiles.push(file);
    }
  }

  tocSections.push({ title: "Archivos de codigo fuente", depth: 2 });

  const dirGroups = groupFilesByDirectory(regularFiles);
  for (const dir of Array.from(dirGroups.keys()).sort()) {
    const dirLabel = dir === "." ? "Raiz" : dir;
    tocSections.push({ title: dirLabel, depth: 3 });
  }

  if (routeFiles.length > 0) tocSections.push({ title: "Archivos de rutas", depth: 2 });
  if (dockerFiles.length > 0) tocSections.push({ title: "Dockerfiles", depth: 2 });
  if (configFiles.length > 0) tocSections.push({ title: "Archivos de configuracion", depth: 2 });

  md += `## Tabla de Contenidos\n\n${generateToc(tocSections)}\n\n---\n\n`;
  md += `## Archivos de codigo fuente\n\n`;

  for (const dir of Array.from(dirGroups.keys()).sort()) {
    const dirFiles = dirGroups.get(dir)!;
    const dirLabel = dir === "." ? "Raiz" : dir;
    md += `### ${dirLabel}\n\n`;

    for (const file of dirFiles) {
      const ext = getExtension(file.name);
      const fileName = file.name.split("/").pop() || file.name;
      if (ext === "md" || ext === "mdx" || ext === "txt") {
        md += `#### \`${fileName}\`\n**Proposito:** Archivo de documentacion/markdown.\n\n`;
      } else if (aiDescriptions?.has(file.name)) {
        md += `#### \`${fileName}\`\n${aiDescriptions.get(file.name)}\n\n`;
      } else {
        md += `#### \`${fileName}\`\n${generateFileDescription(file.content, file.name)}\n\n`;
      }
    }
  }

  if (routeFiles.length > 0) {
    md += `---\n\n### Archivos de rutas\n\n`;
    for (const file of routeFiles) {
      const lang = getLanguage(file.name);
      md += `#### \`${file.name}\`\n\`\`\`${lang}\n${file.content.trimEnd()}\n\`\`\`\n\n`;
    }
  }

  if (dockerFiles.length > 0) {
    md += `---\n\n### Dockerfiles\n\n`;
    for (const file of dockerFiles) {
      if (aiDescriptions?.has(file.name)) {
        md += `${aiDescriptions.get(file.name)}\n\n`;
      } else {
        md += `${analyzeDockerfile(file.content, file.name)}\n\n`;
      }
    }
  }

  if (configFiles.length > 0) {
    md += `---\n\n### Archivos de configuracion\n\n`;
    for (const file of configFiles) {
      const ext = getExtension(file.name);
      md += `#### \`${file.name}\`\n\`\`\`${ext}\n${file.content.trimEnd()}\n\`\`\`\n\n`;
    }
  }

  return md;
}
