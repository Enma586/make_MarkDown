import React from "react";

export interface Blueprint {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  content: string;
}

export interface BlueprintSidebarProps {
  onInject: (content: string) => void;
}
