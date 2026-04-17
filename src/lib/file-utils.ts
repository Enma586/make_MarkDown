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
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

function detectFileRelationships(file: { name: string; content: string }, allFiles: Array<{ name: string; content: string }>): { importedBy: string[] } {
  const filePaths = new Set(allFiles.map((f) => f.name));
  const importedBy: string[] = [];

  for (const other of allFiles) {
    if (other.name === file.name) continue;
    const otherImportRegex = /import\s+(?:type\s+)?\{?\s*[^}]*?\s*\}?\s+from\s+['"](\.\/[^'"]+|@\/[^'"]+)['"]/g;
    let om;
    while ((om = otherImportRegex.exec(other.content)) !== null) {
      let importPath = om[1];
      if (importPath.startsWith("@/")) importPath = importPath.slice(2);
      else importPath = importPath.slice(2);

      const candidates = [importPath, `${importPath}.ts`, `${importPath}.tsx`, `${importPath}.js`, `${importPath}.jsx`, `${importPath}/index.ts`, `${importPath}/index.tsx`];
      if (candidates.some((p) => filePaths.has(p) && p === file.name)) {
        importedBy.push(other.name);
      }
    }
  }

  return { importedBy: [...new Set(importedBy)] };
}

function detectTechStack(files: Array<{ name: string; content: string }>): { languages: Map<string, number>; frameworks: string[]; runtime: string; keyDeps: string[]; buildTool: string; testFramework: string; architecture: string } {
  const languages = new Map<string, number>();
  const frameworks: string[] = [];
  const keyDeps: string[] = [];
  let runtime = "";
  let buildTool = "";
  let testFramework = "";
  let architecture = "";

  for (const file of files) {
    const ext = getExtension(file.name);
    const lang = LANG_MAP[ext] || ext;
    if (["json", "yaml", "toml", "markdown", "mdx", "text", "dockerfile", "bash", "hcl"].includes(lang)) continue;
    languages.set(lang, (languages.get(lang) || 0) + file.content.split("\n").length);
  }

  const pkgFile = files.find((f) => f.name.endsWith("package.json"));
  let pkg: Record<string, unknown> | null = null;
  if (pkgFile) {
    try {
      pkg = JSON.parse(pkgFile.content);
      const deps = Object.keys((pkg as Record<string, Record<string, string>>).dependencies || {});
      const devDeps = Object.keys((pkg as Record<string, Record<string, string>>).devDependencies || {});

      runtime = "Node.js";
      if ((pkg as Record<string, Record<string, string>>).engines?.node) runtime = `Node.js ${(pkg as Record<string, Record<string, string>>).engines.node}`;

      const allDeps = [...deps, ...devDeps];
      if (allDeps.includes("next")) frameworks.push("Next.js");
      if (allDeps.includes("nuxt")) frameworks.push("Nuxt");
      if (allDeps.includes("react") && !frameworks.includes("Next.js")) frameworks.push("React");
      if (allDeps.includes("vue") && !frameworks.includes("Nuxt")) frameworks.push("Vue");
      if (allDeps.includes("svelte") || allDeps.includes("@sveltejs/kit")) frameworks.push("Svelte");
      if (allDeps.includes("angular") || allDeps.includes("@angular/core")) frameworks.push("Angular");
      if (allDeps.includes("express")) frameworks.push("Express");
      if (allDeps.includes("fastify")) frameworks.push("Fastify");
      if (allDeps.includes("hono")) frameworks.push("Hono");
      if (allDeps.includes("nestjs") || allDeps.includes("@nestjs/core")) frameworks.push("NestJS");
      if (allDeps.includes("django")) frameworks.push("Django");
      if (allDeps.includes("flask")) frameworks.push("Flask");
      if (allDeps.includes("fastapi")) frameworks.push("FastAPI");
      if (allDeps.includes("gin-gonic") || allDeps.includes("gin")) frameworks.push("Gin");
      if (allDeps.includes("actix-web")) frameworks.push("Actix Web");
      if (allDeps.includes("rocket")) frameworks.push("Rocket");
      if (allDeps.includes("tailwindcss") || allDeps.includes("@tailwindcss/vite")) keyDeps.push("Tailwind CSS");
      if (allDeps.includes("prisma")) keyDeps.push("Prisma ORM");
      if (allDeps.includes("drizzle-orm")) keyDeps.push("Drizzle ORM");
      if (allDeps.includes("mongoose")) keyDeps.push("Mongoose");
      if (allDeps.includes("typeorm")) keyDeps.push("TypeORM");
      if (allDeps.includes("sequelize")) keyDeps.push("Sequelize");
      if (allDeps.includes("supabase") || allDeps.includes("@supabase/supabase-js")) keyDeps.push("Supabase");
      if (allDeps.includes("firebase")) keyDeps.push("Firebase");
      if (allDeps.includes("zod")) keyDeps.push("Zod");
      if (allDeps.includes("framer-motion")) keyDeps.push("Framer Motion");
      if (allDeps.includes("shadcn") || allDeps.includes("@radix-ui/react-dialog")) keyDeps.push("shadcn/ui");
      if (allDeps.includes("radix-ui")) keyDeps.push("Radix UI");
      if (allDeps.includes("i18next") || allDeps.includes("react-i18next")) keyDeps.push("i18next");
      if (allDeps.includes("react-markdown")) keyDeps.push("react-markdown");
      if (allDeps.includes("axios")) keyDeps.push("Axios");

      if (devDeps.includes("vitest") || allDeps.includes("vitest")) testFramework = "Vitest";
      else if (devDeps.includes("jest") || allDeps.includes("jest")) testFramework = "Jest";

      if (devDeps.includes("vite") || allDeps.includes("vite") || allDeps.includes("@vitejs/plugin-react")) buildTool = "Vite";
      else if (devDeps.includes("webpack") || allDeps.includes("webpack")) buildTool = "Webpack";
      else if (devDeps.includes("esbuild")) buildTool = "esbuild";
      else if (allDeps.includes("turbo")) buildTool = "Turbopack";
    } catch { /* ignore */ }
  }

  const cargoFile = files.find((f) => f.name.endsWith("Cargo.toml"));
  if (cargoFile) {
    runtime = "Rust";
    if (cargoFile.content.includes("actix")) frameworks.push("Actix");
    if (cargoFile.content.includes("rocket")) frameworks.push("Rocket");
    if (cargoFile.content.includes("axum")) frameworks.push("Axum");
    if (cargoFile.content.includes("tokio")) keyDeps.push("Tokio");
    if (cargoFile.content.includes("serde")) keyDeps.push("Serde");
  }

  const goMod = files.find((f) => f.name.endsWith("go.mod"));
  if (goMod) {
    runtime = "Go";
    if (goMod.content.includes("gin-gonic")) frameworks.push("Gin");
    if (goMod.content.includes("fiber")) frameworks.push("Fiber");
    if (goMod.content.includes("echo")) frameworks.push("Echo");
    if (goMod.content.includes("gorm")) keyDeps.push("GORM");
  }

  const pyProject = files.find((f) => f.name.endsWith("pyproject.toml") || f.name === "requirements.txt");
  if (pyProject && !runtime) {
    runtime = "Python";
    const c = pyProject.content;
    if (c.includes("django")) frameworks.push("Django");
    if (c.includes("flask")) frameworks.push("Flask");
    if (c.includes("fastapi")) frameworks.push("FastAPI");
    if (c.includes("sqlalchemy")) keyDeps.push("SQLAlchemy");
    if (c.includes("pydantic")) keyDeps.push("Pydantic");
  }

  if (languages.has("typescript") || languages.has("tsx") || languages.has("javascript") || languages.has("jsx")) {
    const hasApiDir = files.some((f) => f.name.includes("/api/") || f.name.includes("/routes/"));
    const hasComponentsDir = files.some((f) => f.name.includes("/components/"));
    if (hasApiDir && hasComponentsDir) architecture = "Full-stack";
    else if (hasComponentsDir && !hasApiDir) architecture = "Frontend";
    else if (hasApiDir && !hasComponentsDir) architecture = "Backend/API";
    else if (frameworks.some((f) => ["Express", "Fastify", "NestJS", "Gin", "FastAPI", "Django", "Flask", "Hono"].includes(f))) architecture = "Backend/API";
  }
  if (languages.has("python") && !architecture) architecture = "Backend";
  if (languages.has("go") && !architecture) architecture = "Backend";
  if (languages.has("rust") && !architecture) architecture = "Backend";

  return { languages, frameworks, runtime, keyDeps, buildTool, testFramework, architecture };
}

function generateProjectSummary(files: Array<{ name: string; content: string }>): string {
  const stack = detectTechStack(files);
  const totalLines = files.reduce((sum, f) => sum + f.content.split("\n").length, 0);
  const totalFiles = files.length;

  const sortedLangs = Array.from(stack.languages.entries()).sort((a, b) => b[1] - a[1]);
  const langStr = sortedLangs.map(([lang, lines]) => `\`${lang}\` (${lines} lín)`).join(", ");

  let summary = `| Aspecto | Detalle |\n|---------|--------|\n`;
  summary += `| Archivos analizados | ${totalFiles} |\n`;
  summary += `| Lineas totales | ${totalLines.toLocaleString()} |\n`;
  if (stack.runtime) summary += `| Runtime | ${stack.runtime} |\n`;
  if (langStr) summary += `| Lenguajes | ${langStr} |\n`;
  if (stack.architecture) summary += `| Arquitectura | ${stack.architecture} |\n`;
  if (stack.frameworks.length > 0) summary += `| Frameworks | ${stack.frameworks.join(", ")} |\n`;
  if (stack.buildTool) summary += `| Build tool | ${stack.buildTool} |\n`;
  if (stack.testFramework) summary += `| Testing | ${stack.testFramework} |\n`;
  if (stack.keyDeps.length > 0) summary += `| Deps clave | ${stack.keyDeps.join(", ")} |\n`;

  return summary;
}

function summarizeDirectoryDescription(dir: string, files: Array<{ name: string; content: string }>): string {
  const dirLower = dir.toLowerCase();
  const allExports = files.flatMap((f) => extractExports(f.content));

  if (dirLower === "components" || dirLower.includes("components")) {
    const compNames = allExports.filter((e) => /^[A-Z]/.test(e));
    if (compNames.length > 0) return `Componentes UI: ${compNames.slice(0, 10).join(", ")}`;
    return "Componentes de interfaz";
  }
  if (dirLower === "hooks" || dirLower.includes("hooks")) {
    const hookNames = allExports.filter((e) => /^use[A-Z]/.test(e));
    if (hookNames.length > 0) return `Hooks: ${hookNames.join(", ")}`;
    return "Hooks personalizados de React";
  }
  if (dirLower === "lib" || dirLower === "utils" || dirLower === "helpers") {
    const fns = allExports.filter((e) => /^[a-z]/.test(e));
    if (fns.length > 0) return `Utilidades: ${fns.slice(0, 8).join(", ")}`;
    return "Funciones utilitarias y servicios";
  }
  if (dirLower === "services" || dirLower.includes("service")) return "Logica de negocio e integracion con APIs";
  if (dirLower === "types" || dirLower === "interfaces" || dirLower === "models") {
    const typeNames = allExports.filter((e) => /^[A-Z]/.test(e));
    if (typeNames.length > 0) return `Tipos: ${typeNames.slice(0, 10).join(", ")}`;
    return "Definiciones de tipos e interfaces";
  }
  if (dirLower === "routes" || dirLower === "router" || dirLower === "api") return "Definicion de rutas y endpoints HTTP";
  if (dirLower === "middleware") return "Middlewares para procesamiento de peticiones";
  if (dirLower === "controllers" || dirLower === "handlers") return "Manejadores de peticiones HTTP";
  if (dirLower === "stores" || dirLower === "state") return "Gestion de estado global";
  if (dirLower === "contexts" || dirLower === "providers") return "Contextos y providers de React";
  if (dirLower === "config" || dirLower === "settings") return "Configuracion de la aplicacion";
  if (dirLower === "styles" || dirLower === "css") return "Estilos y hojas de estilo";
  if (dirLower === "pages" || dirLower === "views" || dirLower === "screens") return "Paginas y vistas de la aplicacion";
  if (dirLower === "data" || dirLower === "constants") return "Datos estaticos y constantes";
  if (dirLower === "locales" || dirLower === "i18n" || dirLower === "translations") return "Archivos de internacionalizacion";
  if (dirLower === "layouts") return "Componentes de layout estructural";
  if (dirLower === "schemas" || dirLower === "validations") return "Esquemas de validacion de datos";
  if (dirLower === "prisma" || dirLower ===("db")) return "Esquemas y configuracion de base de datos";
  if (dirLower === "migrations") return "Migraciones de base de datos";
  if (dirLower ===("public") || dirLower === "static" || dirLower === "assets") return "Archivos estaticos y recursos publicos";
  if (dirLower === "test" || dirLower === "tests" || dirLower === "__tests__") return "Suite de tests";

  if (allExports.length > 0) return `Exporta: ${allExports.slice(0, 8).join(", ")}`;
  return "";
}

function summarizeConfig(configFiles: Array<{ name: string; content: string }>): string {
  if (configFiles.length === 0) return "";

  const rows = configFiles.map((f) => {
    const baseName = f.name.split("/").pop() || f.name;
    let summary = "";

    if (baseName === "package.json") {
      try {
        const pkg = JSON.parse(f.content);
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});
        const scripts = Object.keys(pkg.scripts || {});
        const name = pkg.name || "";
        const version = pkg.version || "";
        summary = `${name}@${version} — ${deps.length} deps, ${devDeps} devDeps, ${scripts.length} scripts`;
        const mainDeps = deps.filter((d: string) => !["react", "react-dom"].includes(d)).slice(0, 5);
        if (mainDeps.length > 0) summary += ` (principales: ${mainDeps.join(", ")})`;
      } catch {
        summary = "Manifiesto del proyecto";
      }
    } else if (baseName.includes("tsconfig")) {
      try {
        const ts = JSON.parse(f.content);
        const opts = ts.compilerOptions || {};
        const parts: string[] = [];
        if (opts.target) parts.push(`target: ${opts.target}`);
        if (opts.module) parts.push(`module: ${opts.module}`);
        if (opts.moduleResolution) parts.push(`moduleResolution: ${opts.moduleResolution}`);
        if (opts.strict) parts.push("strict");
        if (opts.jsx) parts.push(`jsx: ${opts.jsx}`);
        if (opts.baseUrl) parts.push(`baseUrl: ${opts.baseUrl}`);
        summary = parts.join(", ") || "TypeScript";
      } catch {
        summary = "TypeScript";
      }
    } else if (baseName.includes("eslint")) {
      summary = "ESLint — reglas de linting";
    } else if (baseName.includes("prettier")) {
      summary = "Prettier — formateo de codigo";
    } else if (baseName.includes("vite.config")) {
      const plugins: string[] = [];
      if (f.content.includes("react(")) plugins.push("React");
      if (f.content.includes("tailwindcss")) plugins.push("Tailwind");
      if (f.content.includes("vue()")) plugins.push("Vue");
      if (f.content.includes("svelte()")) plugins.push("Svelte");
      summary = plugins.length > 0 ? `Vite con plugins: ${plugins.join(", ")}` : "Vite bundler";
    } else if (baseName.includes("next.config")) {
      summary = "Next.js — configuracion del framework";
    } else if (baseName.includes("tailwind")) {
      summary = "Tailwind CSS";
    } else if (baseName.includes("docker-compose")) {
      const services = (f.content.match(/^\s*(\w+):/gm) || []).length;
      summary = `Docker Compose — ${services} servicios`;
    } else if (baseName.includes("components.json")) {
      summary = "shadcn/ui — registro de componentes";
    } else if (baseName === ".gitignore") {
      summary = "Archivos ignorados por Git";
    } else {
      summary = `${getLanguage(baseName)} config`;
    }

    return `| \`${baseName}\` | ${summary} |`;
  });

  return `### Configuracion\n\n| Archivo | Descripcion |\n|---------|-------------|\n${rows.join("\n")}`;
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

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const patterns = [
    /export\s+(?:default\s+)?function\s+(\w+)/g,
    /export\s+(?:default\s+)?const\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+interface\s+(\w+)/g,
    /export\s+type\s+(\w+)/g,
    /export\s+async\s+function\s+(\w+)/g,
    /export\s+\{\s*([^}]+)\s*\}/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(content)) !== null) {
      if (p.source.includes("\\{")) {
        m[1].split(",").forEach((s) => {
          const trimmed = s.trim().split(/\s+as\s+/)[0].trim();
          if (trimmed) exports.push(trimmed);
        });
      } else {
        exports.push(m[1]);
      }
    }
  }
  return [...new Set(exports)].slice(0, 8);
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const mod = m[1];
    if (!mod.startsWith(".") && !mod.startsWith("@/")) {
      const pkgName = mod.startsWith("@") ? mod.split("/").slice(0, 2).join("/") : mod.split("/")[0];
      imports.push(pkgName);
    }
  }
  return [...new Set(imports)].slice(0, 6);
}

function extractFunctionNames(content: string): string[] {
  const names: string[] = [];
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    /def\s+(\w+)/g,
    /func\s+(?:\([^)]*\)\s+)?(\w+)/g,
    /fn\s+(\w+)/g,
    /(?:pub\s+)?async\s+fn\s+(\w+)/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(content)) !== null) {
      names.push(m[1]);
    }
  }
  return [...new Set(names)].slice(0, 6);
}

function extractReactHooks(content: string): string[] {
  const hooks: string[] = [];
  const hookRegex = /(?:const|let)\s+\[?\s*[\w,\s]*\s*\]?\s*=\s*(use\w+)\s*\(/g;
  let m;
  while ((m = hookRegex.exec(content)) !== null) {
    hooks.push(m[1]);
  }
  return [...new Set(hooks)].slice(0, 5);
}

function extractEndpoints(content: string): Array<{ method: string; path: string }> {
  const endpoints: Array<{ method: string; path: string }> = [];
  const patterns = [
    /\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"` ]+)/g,
    /app\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"` ]+)/g,
    /router\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"` ]+)/g,
    /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"` ]+)/g,
    /route\s*\(\s*['"`]?(GET|POST|PUT|DELETE|PATCH)['"`]?\s*,\s*['"`]([^'"` ]+)/gi,
    /@(?:Get|Post|Put|Delete|Patch|Options)\(['"`]([^'"` ]+)/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(content)) !== null) {
      const method = p.source.includes("Get|Post") ? m[1].toUpperCase() : m[1].toUpperCase();
      const path = m[2] || m[1];
      endpoints.push({ method, path });
    }
  }
  return [...new Set(endpoints.map((e) => `${e.method} ${e.path}`))].map((e) => {
    const [method, ...rest] = e.split(" ");
    return { method, path: rest.join(" ") };
  }).slice(0, 20);
}

function detectContentPatterns(content: string): string[] {
  const patterns: string[] = [];
  if (/fetch\(|axios|http\.get|http\.post|request\(/.test(content)) patterns.push("HTTP client");
  if (/prisma|mongoose|sequelize|typeorm|drizzle|supabase|firebase\.firestore/.test(content)) patterns.push("DB/ORM");
  if (/jwt|bcrypt|passport|next-auth|auth0|clerk|supabase\.auth/.test(content)) patterns.push("Auth");
  if (/redis|ioredis|cache|memcached/.test(content)) patterns.push("Cache");
  if (/websocket|socket\.io|ws\.on/.test(content)) patterns.push("WebSocket");
  if (/stripe|paypal|mercadopago|payment|checkout/.test(content)) patterns.push("Payments");
  if (/nodemailer|sendgrid|resend|smtp|ses/.test(content)) patterns.push("Email");
  if (/s3|aws-sdk|cloudinary|upload|multer|storage/.test(content)) patterns.push("Storage/Files");
  if (/cron|schedule|queue|bull|celery|rabbitmq|kafka/.test(content)) patterns.push("Jobs/Queue");
  if (/graphql|gql|apollo|urql/.test(content)) patterns.push("GraphQL");
  if (/zod|joi|yup|validator|schema/.test(content)) patterns.push("Validation");
  if (/i18n|t\(|useTranslation|formatMessage|intl/.test(content)) patterns.push("i18n");
  if (/theme|dark|light|useTheme|ThemeProvider/.test(content)) patterns.push("Theming");
  if (/localStorage|sessionStorage|cookie/.test(content)) patterns.push("Browser storage");
  if (/navigator\.|geolocation|camera|notification/.test(content)) patterns.push("Browser APIs");
  if (/framer-motion|spring|animate|transition/.test(content)) patterns.push("Animations");
  if (/react-hook-form|formik|final-form/.test(content)) patterns.push("Form handling");
  if (/tanstack|react-query|swr|useQuery|useMutation/.test(content)) patterns.push("Data fetching");
  if (/zustand|redux|mobx|jotai|recoil|valtio/.test(content)) patterns.push("State management");
  if (/testing-library|vitest|jest|describe\(|it\(/.test(content)) patterns.push("Testing");
  return patterns;
}

function detectComponentBehavior(content: string): string[] {
  const behaviors: string[] = [];
  if (/return\s*\(?\s*<form|<input|<select|<textarea|onSubmit/.test(content)) behaviors.push("formulario");
  if (/<table|<thead|<tbody|<tr|<td/.test(content)) behaviors.push("tabla de datos");
  if (/<video|<audio|<canvas|<img/.test(content)) behaviors.push("multimedia");
  if (/<svg|<path|<circle|<rect/.test(content)) behaviors.push("graficos SVG");
  if (/<nav|<a\s|<Link|navigate|router\.push/.test(content)) behaviors.push("navegacion");
  if (/map\(|\.forEach\(|\.filter\(.*map/.test(content)) behaviors.push("renderizado de listas");
  if (/<dialog|<Modal|onOpenChange|open=\{/.test(content)) behaviors.push("modal/dialog");
  if (/<Drawer|Sheet|Sidebar|slideOver/.test(content)) behaviors.push("panel lateral");
  if (/onDrop|onDrag|drag|DragDrop|DndContext/.test(content)) behaviors.push("drag & drop");
  if (/<Tooltip|title=\{|aria-label/.test(content)) behaviors.push("tooltips/accesibilidad");
  if (/<Tabs|TabList|TabPanel/.test(content)) behaviors.push("tabs/pestanas");
  if (/<Accordion|Collapsible|Collapse/.test(content)) behaviors.push("contenido colapsable");
  if (/<Menu|DropdownMenu|ContextMenu|Popover/.test(content)) behaviors.push("menu contextual");
  if (/<Calendar|DatePicker|date-fns|dayjs/.test(content)) behaviors.push("fechas");
  if (/<Chart|recharts|d3|ChartJS|nivo/.test(content)) behaviors.push("graficos/charts");
  if (/<Toast|toast|notification|sonner|react-hot-toast/.test(content)) behaviors.push("notificaciones");
  if (/<Skeleton|loading|isLoading|spinner/.test(content)) behaviors.push("estados de carga");
  if (/<Avatar|user|profile/.test(content)) behaviors.push("perfil de usuario");
  if (/pagination|paginate|page=\{|usePagination/.test(content)) behaviors.push("paginacion");
  if (/<Command|search|cmdk|Combobox/.test(content)) behaviors.push("buscador/command palette");
  return behaviors;
}

function analyzeFileRole(content: string, filename: string): { type: string; details: string[] } {
  const ext = getExtension(filename);
  const baseName = filename.split("/").pop()?.replace(/\.\w+$/, "") || "";
  const pathParts = filename.split("/").filter(Boolean);

  if (ext === "md" || ext === "mdx" || ext === "txt") {
    const firstLine = content.split("\n").find((l) => l.trim().startsWith("#"))?.trim() || "";
    return { type: "Documento", details: firstLine ? [firstLine.replace(/^#+\s*/, "")] : ["Markdown/texto"] };
  }

  if (isDockerfile(filename)) return { type: "Contenedor", details: [] };
  if (isConfigFile(filename)) {
    const configType = baseName.includes("package") ? "Manifiesto del proyecto"
      : baseName.includes("tsconfig") ? "TypeScript"
      : baseName.includes("eslint") ? "Linting"
      : baseName.includes("prettier") ? "Formateo"
      : baseName.includes("vite") || baseName.includes("webpack") ? "Bundler"
      : baseName.includes("tailwind") ? "Tailwind CSS"
      : baseName.includes("docker-compose") ? "Docker Compose"
      : baseName.includes("jest") || baseName.includes("vitest") ? "Tests"
      : baseName.includes("next.config") ? "Next.js"
      : "Configuracion";
    return { type: "Config", details: [configType] };
  }

  const contentPatterns = detectContentPatterns(content);
  const hooks = extractReactHooks(content);
  const isHook = /use[A-Z]/.test(baseName) || pathParts.includes("hooks") || filename.startsWith("use-");
  if (isHook) {
    const fnNames = extractFunctionNames(content);
    const deps = extractImports(content);
    const details: string[] = [];
    if (hooks.length > 0) details.push(`usa ${hooks.join(", ")}`);
    if (fnNames.length > 0) details.push(`define: ${fnNames.join(", ")}`);
    if (deps.length > 0) details.push(`deps: ${deps.join(", ")}`);
    if (/localStorage|sessionStorage/.test(content)) details.push("persistencia");
    if (/useEffect/.test(content) && /addEventListener|removeEventListener/.test(content)) details.push("gestiona eventos del DOM");
    if (/useEffect/.test(content) && /fetch|axios/.test(content)) details.push("fetch on mount");
    if (contentPatterns.includes("Browser storage")) details.push("browser storage");
    return { type: "Hook", details: details.length > 0 ? details : [`gestion de estado para ${baseName.replace("use", "").replace(/([A-Z])/g, " $1").trim().toLowerCase()}`] };
  }

  if (isRouteFile(filename, content)) {
    const endpoints = extractEndpoints(content);
    if (endpoints.length > 0) {
      return { type: "Rutas", details: endpoints.map((e) => `${e.method} ${e.path}`) };
    }
    return { type: "Rutas", details: ["definicion de endpoints HTTP"] };
  }

  const isComponent = /\.(tsx|jsx)$/.test(filename) || pathParts.includes("components");
  if (isComponent) {
    const exports_ = extractExports(content);
    const compName = exports_.find((e) => /^[A-Z]/.test(e)) || baseName;
    const hasProps = /interface\s+\w*Props|type\s+\w*Props/.test(content);
    const behaviors = detectComponentBehavior(content);

    const details: string[] = [compName];
    if (hasProps) {
      const propsMatch = content.match(/(?:interface|type)\s+(\w*Props)\s*(?:=|\{)/);
      if (propsMatch) details.push(`props: ${propsMatch[1]}`);
    }
    if (hooks.length > 0) details.push(`hooks: ${hooks.join(", ")}`);
    if (behaviors.length > 0) details.push(`UI: ${behaviors.slice(0, 4).join(", ")}`);
    if (contentPatterns.length > 0) details.push(`${contentPatterns.slice(0, 3).join(", ")}`);

    return { type: "Componente", details };
  }

  if (pathParts.includes("services") || pathParts.includes("lib") || pathParts.includes("utils") || pathParts.includes("helpers")) {
    const exports_ = extractExports(content);
    const deps = extractImports(content);
    const fns = extractFunctionNames(content);

    const details: string[] = [];
    if (exports_.length > 0) details.push(`exporta: ${exports_.join(", ")}`);
    if (fns.length > 0 && exports_.length === 0) details.push(`funciones: ${fns.join(", ")}`);
    if (contentPatterns.length > 0) details.push(contentPatterns.slice(0, 3).join(", "));
    if (deps.length > 0) details.push(`deps: ${deps.join(", ")}`);

    return { type: "Modulo", details };
  }

  if (pathParts.includes("types") || pathParts.includes("interfaces") || pathParts.includes("models")) {
    const exports_ = extractExports(content);
    return { type: "Tipos", details: exports_.length > 0 ? exports_ : [`definiciones para ${baseName}`] };
  }

  if (pathParts.includes("middleware")) {
    const contentPatterns_ = detectContentPatterns(content);
    return { type: "Middleware", details: contentPatterns_.length > 0 ? contentPatterns_ : ["intercepta y procesa peticiones"] };
  }

  if (pathParts.includes("test") || pathParts.includes("spec") || pathParts.includes("__tests__")) {
    const describeBlocks = content.match(/(?:describe|it|test)\s*\(\s*['"`]([^'"`]+)/g) || [];
    const tests = describeBlocks.map((b) => b.replace(/^(?:describe|it|test)\s*\(\s*['"`]/, "")).slice(0, 5);
    return { type: "Test", details: tests.length > 0 ? tests : [`tests para ${baseName}`] };
  }

  const exports_ = extractExports(content);
  const fns = extractFunctionNames(content);
  const deps = extractImports(content);
  const details: string[] = [];
  if (exports_.length > 0) details.push(`exporta: ${exports_.join(", ")}`);
  else if (fns.length > 0) details.push(fns.join(", "));
  if (contentPatterns.length > 0) details.push(contentPatterns.slice(0, 3).join(", "));
  if (deps.length > 0) details.push(`usa: ${deps.join(", ")}`);

  return { type: "Archivo", details };
}

export function generateFileDescription(content: string, filename: string): string {
  const { type, details } = analyzeFileRole(content, filename);

  if (details.length === 0) {
    return type;
  }

  const detailStr = details.join(" · ");
  return `${type} — ${detailStr}`;
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

  tocSections.push({ title: "Resumen del proyecto", depth: 2 });
  tocSections.push({ title: "Jerarquia de carpetas", depth: 2 });

  md += `## Resumen del proyecto\n\n${generateProjectSummary(files)}\n\n`;
  md += `## Jerarquia de carpetas\n\n\`\`\`\n${repoName}/\n${tree}\n\`\`\`\n\n`;

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

    const dirDesc = summarizeDirectoryDescription(dir, dirFiles);

    const tableRows = dirFiles.map((file) => {
      const ext = getExtension(file.name);
      const fileName = file.name.split("/").pop() || file.name;
      let description: string;

      if (ext === "md" || ext === "mdx" || ext === "txt") {
        description = "Documento Markdown";
      } else if (aiDescriptions?.has(file.name)) {
        description = aiDescriptions.get(file.name)!.replace(/^\*\*Proposito:\s*\*\*\s*/, "");
      } else {
        description = generateFileDescription(file.content, file.name);
      }

      const { importedBy } = detectFileRelationships(file, files);
      const relHint = importedBy.length > 0 ? ` (usado por ${importedBy.length})` : "";

      return `| \`${fileName}\` | ${description}${relHint} |`;
    });

    const dirHeader = dirDesc ? `### ${dirLabel}\n\n> ${dirDesc}\n\n` : `### ${dirLabel}\n\n`;
    modulesSection.push(`${dirHeader}| Archivo | Descripcion |\n|---------|------------|\n${tableRows.join("\n")}`);
  }

  if (dockerFiles.length > 0) tocSections.push({ title: "Dockerfiles", depth: 2 });
  if (routeFiles.length > 0) tocSections.push({ title: "Rutas / API", depth: 2 });
  if (configFiles.length > 0) tocSections.push({ title: "Configuracion", depth: 2 });

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
      const fileName = file.name.split("/").pop() || file.name;
      const endpoints = extractEndpoints(file.content);
      md += `### \`${fileName}\`\n\n`;
      if (endpoints.length > 0) {
        md += "| Metodo | Ruta |\n|--------|------|\n";
        for (const ep of endpoints) {
          md += `| ${ep.method} | \`${ep.path}\` |\n`;
        }
        md += "\n";
      } else {
        md += "Definicion de endpoints HTTP.\n\n";
      }
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

  tocSections.push({ title: "Resumen del proyecto", depth: 2 });
  tocSections.push({ title: "Jerarquia de carpetas", depth: 2 });

  md += `## Resumen del proyecto\n\n${generateProjectSummary(files)}\n\n`;
  md += `## Jerarquia de carpetas\n\n\`\`\`\n${repoName}/\n${tree}\n\`\`\`\n\n`;

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
    const dirDesc = summarizeDirectoryDescription(dir, dirFiles);
    md += `### ${dirLabel}\n\n`;
    if (dirDesc) md += `> ${dirDesc}\n\n`;

    for (const file of dirFiles) {
      const ext = getExtension(file.name);
      const fileName = file.name.split("/").pop() || file.name;
      if (ext === "md" || ext === "mdx" || ext === "txt") {
        md += `#### \`${fileName}\`\nDocumento Markdown.\n\n`;
      } else if (aiDescriptions?.has(file.name)) {
        md += `#### \`${fileName}\`\n${aiDescriptions.get(file.name)}\n\n`;
      } else {
        const { importedBy } = detectFileRelationships(file, files);
        const desc = generateFileDescription(file.content, file.name);
        const relParts: string[] = [];
        if (importedBy.length > 0) {
          const byNames = importedBy.map((i) => i.split("/").pop() || i).slice(0, 5);
          relParts.push(`usado por: ${byNames.join(", ")}`);
        }
        const relStr = relParts.length > 0 ? `\n\n_${relParts.join(" | ")}_` : "";
        md += `#### \`${fileName}\`\n${desc}${relStr}\n\n`;
      }
    }
  }

  if (routeFiles.length > 0) {
    md += `---\n\n### Archivos de rutas\n\n`;
    for (const file of routeFiles) {
      const fileName = file.name.split("/").pop() || file.name;
      const endpoints = extractEndpoints(file.content);
      md += `#### \`${fileName}\`\n\n`;
      if (endpoints.length > 0) {
        md += "| Metodo | Ruta |\n|--------|------|\n";
        for (const ep of endpoints) {
          md += `| ${ep.method} | \`${ep.path}\` |\n`;
        }
        md += "\n";
      } else {
        md += "Definicion de endpoints HTTP.\n\n";
      }
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
    md += `---\n\n${summarizeConfig(configFiles)}\n\n`;
  }

  return md;
}
