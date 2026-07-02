"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Ask a question about the paper..."}
        disabled={disabled}
        rows={1}
        className={cn(
          "w-full resize-none rounded-lg border border-border bg-background px-4 py-3 pr-12",
          "text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200"
        )}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md",
          "transition-all duration-200",
          input.trim() && !disabled
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground"
        )}
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
