"use client";

import React, { useState, useCallback } from "react";
import { Trash2, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { PaperOverview } from "@/components/PaperOverview";
import { CommandPanel, type CommandType } from "@/components/CommandPanel";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessages, type Message } from "@/components/ChatMessages";
import { ProviderSelector } from "@/components/ProviderSelector";
import { DetailLevelSelector } from "@/components/DetailLevelSelector";
import {
  uploadPaper,
  streamCommand,
  streamQuestion,
  clearHistory,
  type PaperInfo,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Home() {
  const [paper, setPaper] = useState<PaperInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [provider, setProvider] = useState<"azure" | "deepseek">("azure");
  const [detailLevel, setDetailLevel] = useState<"brief" | "detailed" | "comprehensive">("detailed");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadPaper(file);
      setPaper(result.paper);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload paper");
    } finally {
      setIsUploading(false);
    }
  };

  const addMessage = useCallback((role: "user" | "assistant", content: string, isStreaming = false): string => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, role, content, isStreaming }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, content: string, isStreaming = false) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content, isStreaming } : msg))
    );
  }, []);

  const handleCommand = async (command: CommandType) => {
    if (!paper || isLoading) return;
    setIsLoading(true);
    setError(null);

    const commandLabels: Record<CommandType, string> = {
      summarize: "Summarize this paper",
      explain: "Explain the key concepts",
      insights: "Provide insights and analysis",
      section: "Analyze the paper sections",
    };

    addMessage("user", commandLabels[command]);
    const assistantId = addMessage("assistant", "", true);

    try {
      let content = "";
      for await (const chunk of streamCommand({
        action: command,
        detail_level: detailLevel,
        provider,
      })) {
        content += chunk;
        updateMessage(assistantId, content, true);
      }
      updateMessage(assistantId, content, false);
    } catch (err) {
      updateMessage(assistantId, "An error occurred. Please try again.", false);
      setError(err instanceof Error ? err.message : "Failed to execute command");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestion = async (question: string) => {
    if (!paper || isLoading) return;
    setIsLoading(true);
    setError(null);

    addMessage("user", question);
    const assistantId = addMessage("assistant", "", true);

    try {
      let content = "";
      for await (const chunk of streamQuestion(question, provider)) {
        content += chunk;
        updateMessage(assistantId, content, true);
      }
      updateMessage(assistantId, content, false);
    } catch (err) {
      updateMessage(assistantId, "An error occurred. Please try again.", false);
      setError(err instanceof Error ? err.message : "Failed to ask question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionClick = async (section: string) => {
    if (!paper || isLoading) return;
    setIsLoading(true);
    setError(null);

    addMessage("user", `Analyze the "${section}" section`);
    const assistantId = addMessage("assistant", "", true);

    try {
      let content = "";
      for await (const chunk of streamCommand({
        action: "section",
        target: section,
        detail_level: detailLevel,
        provider,
      })) {
        content += chunk;
        updateMessage(assistantId, content, true);
      }
      updateMessage(assistantId, content, false);
    } catch (err) {
      updateMessage(assistantId, "An error occurred. Please try again.", false);
      setError(err instanceof Error ? err.message : "Failed to analyze section");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    await clearHistory();
    setMessages([]);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-card transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">VoyagerP</h1>
          <p className="text-xs text-muted-foreground">Research Paper AI Assistant</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* File Upload */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Paper
            </h2>
            <FileUpload
              onFileSelect={handleFileUpload}
              isLoading={isUploading}
              currentFile={paper?.title}
            />
          </div>

          {/* Paper Overview */}
          {paper && (
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Overview
              </h2>
              <PaperOverview paper={paper} onSectionClick={handleSectionClick} />
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">AI Model</span>
            <ProviderSelector
              provider={provider}
              onChange={setProvider}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Detail</span>
            <DetailLevelSelector
              level={detailLevel}
              onChange={setDetailLevel}
              disabled={isLoading}
            />
          </div>
        </div>
      </aside>

      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-card border border-border rounded-r-md hover:bg-muted transition-colors"
        style={{ left: sidebarOpen ? "calc(20rem - 1px)" : 0 }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="font-medium">
              {paper ? paper.title : "No paper loaded"}
            </h2>
            {paper && (
              <p className="text-xs text-muted-foreground">
                {paper.authors.join(", ")} • {paper.page_count} pages
              </p>
            )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </header>

        {/* Commands */}
        {paper && (
          <div className="p-4 border-b border-border">
            <CommandPanel
              onCommand={handleCommand}
              disabled={isLoading || !paper}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Chat Messages */}
        <ChatMessages messages={messages} />

        {/* Chat Input */}
        <div className="p-4 border-t border-border">
          <ChatInput
            onSubmit={handleQuestion}
            disabled={isLoading || !paper}
            placeholder={
              paper
                ? "Ask a question about the paper..."
                : "Upload a paper to start"
            }
          />
        </div>
      </main>
    </div>
  );
}
