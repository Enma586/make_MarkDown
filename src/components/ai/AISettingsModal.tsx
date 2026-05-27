import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Settings, X, Check, AlertCircle, Globe, Monitor, Cloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AISettings } from "@/hooks/use-ai-settings";

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  configMessage?: string;
}

interface Preset {
  label: string;
  url: string;
  model: string;
  key: string;
  type: "local" | "cloud";
}

const PRESETS: Preset[] = [
  { label: "Ollama", url: "http://localhost:11434/v1", model: "llama3", key: "", type: "local" },
  { label: "LM Studio", url: "http://localhost:1234/v1", model: "default", key: "", type: "local" },
  { label: "Groq", url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", key: "", type: "cloud" },
  { label: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o-mini", key: "", type: "cloud" },
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free", key: "", type: "cloud" },
];

function isRunningOnVercel(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

export const AISettingsModal = ({ open, onClose, settings, onSave, configMessage }: AISettingsModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AISettings>(settings);
  const [saved, setSaved] = useState(false);
  const onVercel = useMemo(() => isRunningOnVercel(), []);

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

  const applyPreset = (preset: Preset) => {
    if (onVercel && preset.type === "local") return;
    setForm({
      apiUrl: preset.url,
      model: preset.model,
      apiKey: preset.key,
    });
  };

  if (!open) return null;

  const isLocalPresetDisabled = (type: string) => onVercel && type === "local";
  const showLocalWarning = onVercel && form.apiUrl && /localhost|127\.0\.0\.1/i.test(form.apiUrl);

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

            {onVercel && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20">
                <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-[0.1em]">Vercel detectado</p>
                  <p className="text-[10px] text-amber-600/70 mt-0.5">
                    Los proveedores locales (Ollama, LM Studio) no estan disponibles en Vercel.
                    Usa Groq, OpenAI u OpenRouter.
                  </p>
                </div>
              </div>
            )}

            {showLocalWarning && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
                <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[10px] text-destructive/80">
                  URL local no accesible desde Vercel. Cambia a un proveedor cloud o configura la IA localmente.
                </p>
              </div>
            )}

            {configMessage && !showLocalWarning && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border/20">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">{configMessage}</p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                {t("ai.presets")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => {
                  const disabled = isLocalPresetDisabled(preset.type);
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset)}
                      disabled={disabled}
                      title={disabled ? "No disponible en Vercel" : preset.label}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-md border transition-colors ${
                        disabled
                          ? "border-border/10 text-muted-foreground/30 cursor-not-allowed"
                          : "border-border/30 hover:border-primary/50 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset.type === "local" ? (
                        <Monitor className="w-3 h-3" />
                      ) : (
                        <Cloud className="w-3 h-3" />
                      )}
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1.5 block">
                  {t("ai.apiUrl")}
                </label>
                <Input
                  value={form.apiUrl}
                  onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
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
