import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — PlacementIQ" }] }),
  component: Assistant,
});

const seed = [
  { role: "ai", text: "Hey Aditi 👋 I'm your placement co-pilot. Ask me anything — resume tips, DSA hints, interview strategy, or what to learn next." },
  { role: "user", text: "How do I improve my ATS score above 90?" },
  { role: "ai", text: "Three concrete moves:\n1. Mirror exact keywords from the JD (React, TypeScript, REST APIs)\n2. Quantify every project bullet — numbers beat adjectives\n3. Drop the photo + tables — ATS parsers choke on them" },
];

function Assistant() {
  const [msgs, setMsgs] = useState(seed);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { role: "user", text: input }, { role: "ai", text: "I'd love to answer that in real-time — connect Lovable AI to enable live responses!" }]);
    setInput("");
  };

  const suggestions = [
    "Roast my resume",
    "Mock me on React hooks",
    "What should I learn next week?",
    "How to crack Stripe frontend round?",
  ];

  return (
    <DashboardShell title="AI Career Assistant" subtitle="Your 24/7 placement co-pilot">
      <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
        <motion.div whileHover={{ y: -2 }} className="lg:col-span-3 glass-strong neon-border rounded-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "ai" && (
                  <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center glow shrink-0">
                    <Bot className="size-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  m.role === "user" ? "bg-gradient-primary text-white" : "glass"
                }`}>{m.text}</div>
                {m.role === "user" && (
                  <div className="size-8 rounded-lg glass grid place-items-center shrink-0">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 p-4">
            <div className="flex gap-2 mb-3 flex-wrap">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs glass rounded-full px-3 py-1.5 hover:bg-white/10 transition"
                >{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <Sparkles className="size-4 text-neon" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything about your placement prep…"
                className="bg-transparent outline-none flex-1 text-sm"
              />
              <button onClick={send} className="size-9 grid place-items-center rounded-lg bg-gradient-primary glow">
                <Send className="size-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-bold mb-3">Quick Tools</h3>
          <ul className="space-y-2 text-sm">
            {["Resume Reviewer", "Cover Letter AI", "LinkedIn Optimizer", "Salary Negotiation Coach", "Project Idea Generator"].map((t) => (
              <li key={t} className="glass rounded-xl p-3 hover:bg-white/10 cursor-pointer transition">
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
