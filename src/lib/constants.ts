import type { TFunction } from "i18next";

export type ViewMode = "split" | "editor" | "preview";

export function getDefaultContent(t: TFunction): string {
  return `# ${t("defaultContent.title")}

> ${t("defaultContent.subtitle")}

---

## ${t("defaultContent.start")}

1. ${t("defaultContent.step1")}
2. ${t("defaultContent.step2")}
3. ${t("defaultContent.step3")}
4. ${t("defaultContent.step4")}

### ${t("defaultContent.importPaste")}

${t("defaultContent.importDesc")}
${t("defaultContent.pasteDesc")}
${t("defaultContent.smartDesc")}

### ${t("defaultContent.aiTitle")}

${t("defaultContent.aiDesc1")}
${t("defaultContent.aiDesc2")}

### ${t("defaultContent.shortcuts")}

- ${t("defaultContent.shortcut1")}
- ${t("defaultContent.shortcut2")}
- ${t("defaultContent.shortcut3")}
`;
}
