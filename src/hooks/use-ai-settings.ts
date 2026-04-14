import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "docu-stream-ai-settings";

export interface AISettings {
  apiUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_SETTINGS: AISettings = {
  apiUrl: "http://localhost:11434/v1",
  apiKey: "",
  model: "llama3",
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((newSettings: AISettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const isConfigured = settings.apiUrl.length > 0 && settings.model.length > 0;

  return { settings, updateSettings, isConfigured, isLoaded };
}
