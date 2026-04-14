import type { AISettings } from "@/hooks/use-ai-settings";
import { extractEssentialCode, detectCodeLanguage } from "@/lib/file-utils";

const SYSTEM_PROMPT = `You are a technical documentation assistant. Analyze source code and produce clean, well-structured Markdown documentation.

Rules:
- Output ONLY valid Markdown.
- Use headings (##, ###) to organize sections logically.
- For each function, class, or important block, create a ### heading with its name.
- Include a brief description of what each section does.
- Wrap ALL code in fenced code blocks with the correct language tag.
- Keep code blocks complete — do not truncate code.
- Add an overview table at the top: language, lines, sections.

Structure:
# [filename]
> Brief description.
| Property | Value |
|----------|-------|
| Language | [lang] |
| Lines | [count] |
| Sections | [count] |
---
## Overview
[summary]
---
### [Section Name]
[description]
\`\`\`[language]
[code]
\`\`\`

IMPORTANT: Never modify the actual code. Only add documentation around it.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const CHARS_PER_TOKEN = 3;
const MAX_INPUT_TOKENS = 5500;
const SYSTEM_PROMPT_TOKENS = 250;
const WRAPPER_TOKENS = 100;
const CHUNK_DELAY_MS = 1500;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;

  const lines = text.split("\n");
  let result = "";
  for (const line of lines) {
    if ((result + "\n" + line).length > maxChars) break;
    result += (result ? "\n" : "") + line;
  }

  const truncatedLines = result.split("\n").length;
  const totalLines = text.split("\n").length;

  return (
    result +
    `\n\n// ... [truncated: showing ${truncatedLines} of ${totalLines} lines to fit token limit]`
  );
}

async function callAPI(
  messages: ChatMessage[],
  settings: AISettings,
  maxTokens: number,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.apiKey) {
    headers["Authorization"] = `Bearer ${settings.apiKey}`;
  }

  const response = await fetch(`${settings.apiUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API returned no content");
  }

  return content.trim();
}

export async function structureWithAI(
  code: string,
  filename: string,
  settings: AISettings,
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const isDocFile = ["md", "mdx", "txt", "rst", "adoc"].includes(ext);
  const isLargeFile = code.length > MAX_INPUT_TOKENS * CHARS_PER_TOKEN;

  let processedCode = code;

  if (!isDocFile && isLargeFile) {
    const detectedLang = detectCodeLanguage(code) || ext || "text";
    processedCode = extractEssentialCode(code, detectedLang);
  }

  const codeTokens = estimateTokens(processedCode);
  const totalRequestTokens = codeTokens + SYSTEM_PROMPT_TOKENS + WRAPPER_TOKENS;
  const budgetTokens = MAX_INPUT_TOKENS;

  if (totalRequestTokens <= budgetTokens) {
    const sizeNote = isLargeFile && !isDocFile
      ? `\n\nNOTE: This file was large (${code.split("\n").length} lines). Only essential code sections (${processedCode.split("\n").length} lines) were extracted for documentation.`
      : "";
    const userPrompt = `Analyze this file and produce structured documentation.${sizeNote}\n\nFilename: ${filename}\n\n\`\`\`\n${processedCode}\n\`\`\``;
    return callAPI(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      settings,
      4000,
    );
  }

  const lines = processedCode.split("\n");
  const totalLines = lines.length;
  const chunkSize = Math.max(50, Math.floor(totalLines / 3));
  const chunks: string[] = [];

  for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join("\n"));
  }

  const chunkResults: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const startLine = i * chunkSize + 1;
    const endLine = Math.min((i + 1) * chunkSize, totalLines);

    const truncated = truncateToTokens(chunk, MAX_INPUT_TOKENS);
    const userPrompt = `This is PART ${i + 1} of ${chunks.length} of a file (${filename}, lines ${startLine}-${endLine} of ${totalLines}). Produce documentation for this part only. Use ### headings for each section.\n\n\`\`\`\n${truncated}\n\`\`\``;

    const result = await callAPI(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      settings,
      3000,
    );

    chunkResults.push(result);

    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
    }
  }

  const originalLines = code.split("\n").length;
  return `# ${filename}\n\n> Auto-generated documentation (processed in ${chunks.length} chunks due to file size).\n\n| Property | Value |\n|----------|-------|\n| Original Lines | ${originalLines} |\n| Processed Lines | ${totalLines} |\n| Chunks | ${chunks.length} |\n\n---\n\n${chunkResults.join("\n\n---\n\n")}`;
}

const DESCRIBE_SYSTEM_PROMPT = `You are a code documentation assistant. Provide a brief 1-2 line description of what a source file does.
Rules:
- Output ONLY the description, nothing else.
- Start with what the file is (component, hook, service, utility, etc.).
- Mention its main purpose or responsibility.
- Be concise and accurate.
- Do NOT output markdown formatting, code blocks, or headings.`;

export async function describeFileWithAI(
  code: string,
  filename: string,
  settings: AISettings,
): Promise<string> {
  const truncated = code.length > 3000 ? code.slice(0, 3000) + "\n// ... [truncated]" : code;
  const userPrompt = `Analyze this source file and provide a brief 1-2 line description of its purpose.\n\nFilename: ${filename}\n\n\`\`\`\n${truncated}\n\`\`\``;

  return callAPI(
    [
      { role: "system", content: DESCRIBE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    settings,
    150,
  );
}
