import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AISettings } from "@/hooks/use-ai-settings";

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

const PRESETS = [
  { label: "Ollama (local)", url: "http://localhost:11434/v1", model: "llama3", key: "" },
  { label: "LM Studio (local)", url: "http://localhost:1234/v1", model: "default", key: "" },
  { label: "Groq", url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", key: "" },
  { label: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o-mini", key: "" },
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free", key: "" },
];

export const AISettingsModal = ({ open, onClose, settings, onSave }: AISettingsModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AISettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings, open]);

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setForm({
      apiUrl: preset.url,
      model: preset.model,
      apiKey: preset.key,
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-md mx-4 bg-background border border-border/40 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">{t("ai.settings")}</h2>
            </div>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="px-2 py-1 text-[10px] font-mono rounded-md border border-border/30 hover:border-primary/50 hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                  {t("ai.apiUrl")}
                </label>
                <Input
                  value={form.apiUrl}
                  onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                  placeholder="http://localhost:11434/v1"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                  {t("ai.apiKey")}
                </label>
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={t("ai.apiKeyPlaceholder")}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                  {t("ai.model")}
                </label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder={t("ai.modelPlaceholder")}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/30 bg-muted/10">
            <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>
              {t("ai.cancel")}
            </Button>
            <Button size="sm" className="text-xs" onClick={handleSave}>
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {t("ai.saved")}
                </>
              ) : (
                t("ai.save")
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
