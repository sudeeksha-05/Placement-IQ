import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatAssistant } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — PlacementIQ" }] }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };

const seed: Msg[] = [
  { role: "assistant", content: "Hey 👋 I'm PlacementIQ — your AI placement co-pilot. Ask me anything: resume tips, DSA strategy, interview prep, salary negotiation, or what to learn next." },
];

function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await chat({ data: { messages: next } });
      setMsgs([...next, { role: "assistant", content: reply || "(no response)" }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reach AI");
      setMsgs(next);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Roast my resume",
    "Quiz me on React hooks",
    "What should I learn next week?",
    "How to crack Stripe frontend round?",
  ];

  return (
    <DashboardShell title="AI Career Assistant" subtitle="Your 24/7 placement co-pilot · powered by Lovable AI">
      <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        <motion.div whileHover={{ y: -2 }} className="lg:col-span-3 glass-strong neon-border rounded-2xl flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center glow shrink-0">
                    <Bot className="size-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user" ? "bg-gradient-primary text-white" : "glass"
                }`}>{m.content}</div>
                {m.role === "user" && (
                  <div className="size-8 rounded-lg glass grid place-items-center shrink-0">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center glow shrink-0">
                  <Bot className="size-4 text-white" />
                </div>
                <div className="glass rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border/50 p-4">
            <div className="flex gap-2 mb-3 flex-wrap">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading}
                  className="text-xs glass rounded-full px-3 py-1.5 hover:bg-white/10 transition disabled:opacity-50">{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <Sparkles className="size-4 text-neon" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={loading}
                placeholder="Ask anything about your placement prep…"
                className="bg-transparent outline-none flex-1 text-sm disabled:opacity-50"
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="size-9 grid place-items-center rounded-lg bg-gradient-primary glow disabled:opacity-50">
                {loading ? <Loader2 className="size-4 text-white animate-spin" /> : <Send className="size-4 text-white" />}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-bold mb-3">Quick Prompts</h3>
          <ul className="space-y-2 text-sm">
            {[
              "Review my resume for SDE role",
              "Write a cover letter for Google",
              "Explain time complexity simply",
              "Negotiate a 25 LPA offer",
              "3 project ideas for my CV",
            ].map((t) => (
              <li key={t} onClick={() => send(t)}
                className="glass rounded-xl p-3 hover:bg-white/10 cursor-pointer transition">{t}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
