import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  FormEvent,
} from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const API_URL = "https://customer-chat-backend.onrender.com";
const MAX_CHARS = 180;

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---------- Load session ---------- */
  useEffect(() => {
    const stored = localStorage.getItem("sessionId");
    if (stored && stored !== "undefined") {
      setSessionId(stored);
    }
  }, []);

  /* ---------- Fetch history ---------- */
  useEffect(() => {
    if (!sessionId) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`${API_URL}/chat/${sessionId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMessages(data.messages ?? []);
      } catch {
        setMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: "⚠️ Unable to load previous messages, but you can continue chatting.",
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  /* ---------- Auto scroll ---------- */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* ---------- Toast auto-hide ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Send message ---------- */
  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSending || isLoadingHistory) return;

    if (input.length > MAX_CHARS) {
      setToast(`Message limit is ${MAX_CHARS} characters`);
      return;
    }

    const text = input;
    setInput("");
    setIsSending(true);

    setMessages(prev => [...prev, { sender: "user", text }]);

    try {
      const res = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rmessage: text,
          sessionId: sessionId ?? undefined,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setMessages(prev => [...prev, { sender: "ai", text: data.reply }]);

      setSessionId(data.sessionId);
      localStorage.setItem("sessionId", data.sessionId);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Sorry, I’m having trouble right now. Please try again shortly.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  /* ---------- Render message ---------- */
  const renderMessage = (m: Message, i: number) => (
    <div
      key={i}
      className={`flex items-start gap-3 mb-4 ${
        m.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {m.sender === "ai" && (
        <div className="bg-blue-500 rounded-full p-2 text-white">
          <Bot size={18} />
        </div>
      )}

      <div
        className={`p-3 rounded-lg max-w-xs md:max-w-md break-words text-sm ${
          m.sender === "user"
            ? "bg-green-500 text-white rounded-tr-none"
            : "bg-gray-200 text-gray-800 rounded-tl-none"
        }`}
      >
        {m.text}
      </div>

      {m.sender === "user" && (
        <div className="bg-green-500 rounded-full p-2 text-white">
          <User size={18} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="w-full max-w-md h-[600px] bg-white rounded-2xl shadow-xl flex flex-col">

        <header className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl">
          <h1 className="text-lg font-semibold">Customer Support</h1>
          <p className="text-xs opacity-90">We usually reply within minutes</p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoadingHistory && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Start a conversation 👋
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-3 border-t bg-white rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              value={input}
              maxLength={MAX_CHARS}
              onChange={(e) => {
                if (e.target.value.length > MAX_CHARS) {
                  setToast(`Message limit is ${MAX_CHARS} characters`);
                  return;
                }
                setInput(e.target.value);
              }}
              placeholder="Type your message…"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isSending || isLoadingHistory}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className={`px-3 py-2 rounded-lg ${
                isSending
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isSending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-right mt-1">
            {input.length}/{MAX_CHARS}
          </p>
        </footer>

      </div>
    </div>
  );
};

export default ChatPage;
