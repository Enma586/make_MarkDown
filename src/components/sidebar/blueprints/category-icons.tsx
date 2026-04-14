import React from "react";
import { Layers, Container, Terminal, Cpu, BookOpen } from "lucide-react";

export const categoryIcons: Record<string, React.ReactNode> = {
  Structure: <Layers className="w-3.5 h-3.5" />,
  Infra: <Container className="w-3.5 h-3.5" />,
  Backend: <Terminal className="w-3.5 h-3.5" />,
  Ops: <Cpu className="w-3.5 h-3.5" />,
  Docs: <BookOpen className="w-3.5 h-3.5" />,
};

export const CATEGORIES = ["Structure", "Infra", "Backend", "Ops", "Docs"] as const;
