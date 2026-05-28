import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Video, Mic, MessageSquareCode, Play, Loader2, Send, RotateCcw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { interviewTurn } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — PlacementIQ" }] }),
  component: Interview,
});

type Turn = { question: string; answer: string; feedback?: { score: number; strengths: string; improvements: string } | null };

const ROUNDS = [
  { i: Video, t: "Technical", d: "DSA + CS fundamentals", color: "from-primary/40 to-accent/20", type: "Technical" as const },
  { i: Mic, t: "HR", d: "Behavioral & culture-fit", color: "from-accent/40 to-neon-2/20", type: "HR" as const },
  { i: MessageSquareCode, t: "Coding", d: "Live problem walkthrough", color: "from-neon/40 to-primary/20", type: "Coding" as const },
];

function Interview() {
  const [role, setRole] = useState("Frontend Engineer");
  const [type, setType] = useState<"Technical" | "HR" | "Coding" | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentQ, setCurrentQ] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(interviewTurn);

  const begin = async (t: "Technical" | "HR" | "Coding") => {
    setType(t); setTurns([]); setCurrentQ(""); setAnswer(""); setLoading(true);
    try {
      const r = await ask({ data: { role, type: t, history: [] } });
      setCurrentQ(r.question);
    } catch (e: any) { toast.error(e?.message ?? "Failed to start"); setType(null); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!answer.trim() || !type || loading) return;
    setLoading(true);
    const myAnswer = answer.trim();
    try {
      const r = await ask({
        data: {
          role, type,
          history: turns.map(t => ({ question: t.question, answer: t.answer })).concat([{ question: currentQ, answer: myAnswer }]),
          nextAnswer: myAnswer,
        },
      });
      setTurns([...turns, { question: currentQ, answer: myAnswer, feedback: r.feedback }]);
      setCurrentQ(r.question);
      setAnswer("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const reset = () => { setType(null); setTurns([]); setCurrentQ(""); setAnswer(""); };

  if (type) {
    const avg = turns.filter(t => t.feedback).length
      ? Math.round(turns.reduce((s, t) => s + (t.feedback?.score ?? 0), 0) / turns.filter(t => t.feedback).length)
      : null;

    return (
      <DashboardShell title={`${type} Round`} subtitle={`${role} · AI interviewer live`}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs glass rounded-full px-3 py-1.5">Question {turns.length + 1}</div>
          <div className="flex gap-2">
            {avg !== null && <div className="text-xs glass rounded-full px-3 py-1.5">Avg score: <span className="text-neon-2 font-bold">{avg}</span></div>}
            <button onClick={reset} className="text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1 hover:bg-white/10">
              <RotateCcw className="size-3" /> End
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <motion.div whileHover={{ y: -2 }} className="lg:col-span-2 glass-strong neon-border rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-neon-2 mb-2">Interviewer asks</p>
            {loading && !currentQ ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Preparing question…</div>
            ) : (
              <p className="text-lg font-display leading-relaxed">{currentQ}</p>
            )}

            <div className="mt-5">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading || !currentQ}
                rows={6}
                placeholder="Type your answer here… Be specific, use STAR for behavioral, walk through your reasoning for technical."
                className="w-full glass rounded-xl p-3 text-sm bg-transparent outline-none resize-none disabled:opacity-50"
              />
              <button onClick={submit} disabled={loading || !answer.trim()}
                className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-primary text-white glow font-semibold flex items-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit answer
              </button>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-5 max-h-[70vh] overflow-y-auto">
            <h3 className="font-display font-bold mb-3">Live feedback</h3>
            {turns.length === 0 && <p className="text-xs text-muted-foreground">No answers submitted yet.</p>}
            <div className="space-y-3">
              {[...turns].reverse().map((t, i) => (
                <div key={i} className="glass rounded-xl p-3 text-xs">
                  <p className="text-muted-foreground mb-1 line-clamp-2"><span className="text-neon-2">Q:</span> {t.question}</p>
                  {t.feedback && (
                    <>
                      <p className="text-lg font-display font-bold text-gradient">{t.feedback.score}/100</p>
                      <p className="mt-1"><span className="text-emerald-400">+ </span>{t.feedback.strengths}</p>
                      <p className="mt-1"><span className="text-orange-400">→ </span>{t.feedback.improvements}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Mock Interview" subtitle="AI-driven simulation · realistic, role-specific, instant feedback">
      <motion.div whileHover={{ y: -2 }} className="glass-strong neon-border rounded-2xl p-6 mb-6">
        <label className="text-xs uppercase tracking-widest text-neon-2">Target role</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Backend Engineer, Data Analyst, Product Manager"
          className="mt-2 w-full glass rounded-xl px-4 py-3 bg-transparent outline-none text-sm"
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        {ROUNDS.map((s) => (
          <motion.div key={s.t} whileHover={{ y: -4 }}
            className="glass neon-border rounded-2xl p-6 cursor-pointer relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-40`} />
            <div className="relative">
              <div className="size-12 rounded-xl bg-gradient-primary grid place-items-center glow mb-3">
                <s.i className="size-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg">{s.t} Round</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
              <button onClick={() => begin(s.type)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-white text-xs glow">
                <Play className="size-3" /> Start Session
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
