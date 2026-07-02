"use client";

import React from "react";
import {
  FileText,
  Lightbulb,
  MessageSquare,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CommandType = "summarize" | "explain" | "insights" | "section";

interface CommandButton {
  type: CommandType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const commands: CommandButton[] = [
  {
    type: "summarize",
    label: "Summarize",
    description: "Get a structured summary",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    type: "explain",
    label: "Explain",
    description: "Break down concepts",
    icon: <Lightbulb className="w-4 h-4" />,
  },
  {
    type: "insights",
    label: "Insights",
    description: "Critical analysis",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    type: "section",
    label: "Sections",
    description: "Analyze specific parts",
    icon: <BookOpen className="w-4 h-4" />,
  },
];

interface CommandPanelProps {
  onCommand: (command: CommandType) => void;
  disabled?: boolean;
  activeCommand?: CommandType;
}

export function CommandPanel({ onCommand, disabled, activeCommand }: CommandPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {commands.map((cmd) => (
        <button
          key={cmd.type}
          onClick={() => onCommand(cmd.type)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left",
            activeCommand === cmd.type
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "p-2 rounded-md",
            activeCommand === cmd.type ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {cmd.icon}
          </div>
          <div>
            <p className="text-sm font-medium">{cmd.label}</p>
            <p className="text-xs text-muted-foreground">{cmd.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
