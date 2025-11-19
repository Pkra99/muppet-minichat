// ui/src/App.tsx
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createTranslator } from "./i18n";
import type { Locale } from "./i18n";

type Role = "user" | "assistant";
type Theme = "light" | "dark";

interface ChatMessage {
  id: number;
  role: Role;
  text: string;
}

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:4000";
const TENANT_ID = "demo-tenant-A";

const STORAGE_KEYS = {
  messages: "muppet-messages",
  theme: "muppet-theme"
};

function safeLoadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.messages);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: any) =>
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.text === "string" &&
        typeof m.id === "number"
    );
  } catch {
    return [];
  }
}

function safeLoadTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.theme);
    return raw === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [messages, setMessages] = useState<ChatMessage[]>(() => safeLoadMessages());
  const [theme, setTheme] = useState<Theme>(() => safeLoadTheme());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const t = createTranslator(locale);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nextIdRef = useRef<number>(1);

  useEffect(() => {
    if (messages.length > 0) {
      const maxId = messages.reduce((max, m) => (m.id > max ? m.id : max), 0);
      nextIdRef.current = maxId + 1;
    }
  }, []); 

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.dataset.theme = theme;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userId = nextIdRef.current++;
    const botId = nextIdRef.current++;

    const userMsg: ChatMessage = {
      id: userId,
      role: "user",
      text: trimmed
    };

    setMessages(prev => [...prev, userMsg, { id: botId, role: "assistant", text: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const url = `${GATEWAY_URL}/api/v1/chat/stream?msg=${encodeURIComponent(
        trimmed
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          "X-Tenant-Id": TENANT_ID
        }
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let currentBotText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n");
          let eventType = "message";
          let dataLine = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice("event:".length).trim();
            } else if (line.startsWith("data:")) {
              dataLine = line.slice("data:".length).trim();
            }
          }

          if (eventType === "chunk") {
            const chunk = JSON.parse(dataLine) as string;
            currentBotText += (currentBotText ? " " : "") + chunk;

            setMessages(prev =>
              prev.map(m =>
                m.id === botId ? { ...m, text: currentBotText } : m
              )
            );
            scrollToBottom();
          } else if (eventType === "done") {
            setIsStreaming(false);
          } else if (eventType === "error") {
            console.error("SSE error event:", dataLine);
            setIsStreaming(false);
          }
        }
      }

      setIsStreaming(false);
    } catch (err) {
      console.error("stream error", err);
      setIsStreaming(false);
    }
  };

  const themeLabel = theme === "light" ? "Dark mode" : "Light mode";

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo" aria-hidden="true">
            MM
          </div>
          <div>
            <div className="app-title">Muppet MiniChat</div>
            <div className="app-subtitle">Streaming chat · Demo environment</div>
          </div>
        </div>

        <div className="app-header-controls">
          <div className="pill pill-tenant">
            <span className="pill-label">Tenant</span>
            <code className="pill-value">{TENANT_ID}</code>
          </div>

          <label className="control-group">
            <span className="control-label">{t("language")}</span>
            <select
              aria-label={t("language")}
              value={locale}
              onChange={e => setLocale(e.target.value as Locale)}
            >
              <option value="en">{t("en")}</option>
              <option value="es">{t("es")}</option>
            </select>
          </label>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={themeLabel}
          >
            {theme === "light" ? "🌙" : "☀️"}
            <span className="theme-toggle-text">{themeLabel}</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="app-main">
        <section
          aria-live="polite"
          aria-label="Chat messages"
          className="chat-panel"
        >
          {messages.map(msg => (
            <div key={msg.id} className={`chat-row chat-row-${msg.role}`}>
              <div className="chat-bubble" data-role={msg.role}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>

        {isStreaming && (
          <div className="typing-indicator">{t("typing")}</div>
        )}

        <form onSubmit={handleSubmit} className="input-form">
          <label htmlFor="chat-input" className="input-label">
            {t("inputLabel")}
          </label>
          <div className="input-row">
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="chat-input"
            />
            <button
              type="submit"
              aria-label={t("send")}
              disabled={isStreaming || !input.trim()}
              className="send-button"
            >
              {t("send")}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-left">
          <span>© {new Date().getFullYear()} Muppet MiniChat</span>
          <span className="footer-dot">•</span>
          <span>Demo chat, not production data</span>
        </div>
        <div className="footer-right">
          <span>Tenant:</span>{" "}
          <code className="pill-value">{TENANT_ID}</code>
        </div>
      </footer>
    </div>
  );
}

export default App;
