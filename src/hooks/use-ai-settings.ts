import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "docu-stream-ai-settings";

export interface AISettings {
  apiUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_SETTINGS: AISettings = {
  apiUrl: "",
  apiKey: "",
  model: "",
};

function isRunningOnVercel(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
}

function isLocalUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((newSettings: AISettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // localStorage might be full or unavailable
    }
  }, []);

  const isConfigured = useMemo(() => {
    const hasUrl = settings.apiUrl.length > 0;
    const hasModel = settings.model.length > 0;
    const onVercel = isRunningOnVercel();

    if (!hasUrl || !hasModel) return false;

    if (onVercel && isLocalUrl(settings.apiUrl)) {
      return false;
    }

    return true;
  }, [settings.apiUrl, settings.model]);

  const configMessage = useMemo(() => {
    const onVercel = isRunningOnVercel();
    if (onVercel && (isLocalUrl(settings.apiUrl) || !settings.apiUrl)) {
      return "Usa un proveedor cloud (Groq, OpenAI, OpenRouter) — Ollama/LM Studio no funcionan en Vercel";
    }
    if (!settings.apiUrl) return "Ingresa una URL de API compatible con OpenAI";
    if (!settings.model) return "Elige o escribe el nombre del modelo";
    return "";
  }, [settings.apiUrl, settings.model]);

  return { settings, updateSettings, isConfigured, isLoaded, configMessage };
}
