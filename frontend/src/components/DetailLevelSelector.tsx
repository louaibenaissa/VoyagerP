"use client";

import React from "react";
import { cn } from "@/lib/utils";

type DetailLevel = "brief" | "detailed" | "comprehensive";

interface DetailLevelSelectorProps {
  level: DetailLevel;
  onChange: (level: DetailLevel) => void;
  disabled?: boolean;
}

const levels: { value: DetailLevel; label: string }[] = [
  { value: "brief", label: "Brief" },
  { value: "detailed", label: "Detailed" },
  { value: "comprehensive", label: "Comprehensive" },
];

export function DetailLevelSelector({ level, onChange, disabled }: DetailLevelSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {levels.map((l) => (
        <button
          key={l.value}
          onClick={() => onChange(l.value)}
          disabled={disabled}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
            level === l.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
