const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PaperInfo {
  title: string;
  authors: string[];
  abstract: string;
  page_count: number;
  sections: { title: string; pages: string }[];
}

export interface CommandRequest {
  action: "summarize" | "explain" | "insights" | "ask" | "section";
  target?: string;
  detail_level?: "brief" | "detailed" | "comprehensive";
  provider?: "azure" | "deepseek";
  stream?: boolean;
}

export interface ConfigResponse {
  default_provider: "azure" | "deepseek";
  azure_configured: boolean;
  deepseek_configured: boolean;
}

export async function uploadPaper(file: File): Promise<{ success: boolean; paper: PaperInfo }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to upload paper");
  }

  return response.json();
}

export async function getPaperOverview(): Promise<PaperInfo> {
  const response = await fetch(`${API_BASE_URL}/paper`);

  if (!response.ok) {
    throw new Error("No paper loaded");
  }

  return response.json();
}

export async function executeCommand(request: CommandRequest): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to execute command");
  }

  const data = await response.json();
  return data.response;
}

export async function* streamCommand(request: CommandRequest): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE_URL}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to execute command");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) yield parsed.content;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function askQuestion(question: string, provider?: "azure" | "deepseek"): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, provider }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to ask question");
  }

  const data = await response.json();
  return data.response;
}

export async function* streamQuestion(question: string, provider?: "azure" | "deepseek"): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, provider, stream: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to ask question");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) yield parsed.content;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

export async function clearHistory(): Promise<void> {
  await fetch(`${API_BASE_URL}/clear`, { method: "POST" });
}

export async function getConfig(): Promise<ConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/config`);
  return response.json();
}
