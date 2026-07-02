"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProviderSelectorProps {
  provider: "azure" | "deepseek";
  onChange: (provider: "azure" | "deepseek") => void;
  disabled?: boolean;
}

export function ProviderSelector({ provider, onChange, disabled }: ProviderSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <button
        onClick={() => onChange("azure")}
        disabled={disabled}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
          provider === "azure"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        Azure GPT-4o
      </button>
      <button
        onClick={() => onChange("deepseek")}
        disabled={disabled}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
          provider === "deepseek"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        DeepSeek V4
      </button>
    </div>
  );
}
