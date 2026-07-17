"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "analyst";
  text: string;
}

const SUGGESTIONS = [
  "Who should I predict to win the EPL this week?",
  "Explain the offside rule simply",
  "Which teams are in best form right now?",
  "Show me some goals highlights",
  "What's the biggest upset this season?",
];

export function AIAnalyst({ sport }: { sport?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sport }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "analyst", text: data.reply ?? "No response — try again." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "analyst", text: "⚠️ Analyst offline. Check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-pitch-600 hover:bg-pitch-500 shadow-xl flex items-center justify-center text-2xl transition-colors"
        aria-label="Open AI Analyst"
      >
        {open ? "✕" : "🤖"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[520px] flex flex-col bg-stadium-900 border border-stadium-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-stadium-700 flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-white font-bold text-sm">MatchDay AI Analyst</p>
                <p className="text-pitch-400 text-xs">Powered by Gemini + Qdrant highlights</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-stadium-500 text-xs text-center pt-2">
                    Ask me anything about sports 🏆
                  </p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-stadium-800 hover:bg-stadium-700 text-stadium-300 text-xs transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-pitch-700 text-white rounded-br-sm"
                        : "bg-stadium-800 text-stadium-200 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl bg-stadium-800 text-stadium-400 text-xs rounded-bl-sm">
                    Analysing
                    <span className="inline-flex gap-0.5 ml-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-stadium-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-stadium-700 p-3 flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any match…"
                className="flex-1 bg-stadium-800 text-white placeholder:text-stadium-500 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-pitch-600"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-3 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-40 text-white text-sm font-bold transition-colors"
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
