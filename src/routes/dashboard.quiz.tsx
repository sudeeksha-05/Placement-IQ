import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Brain, ChevronRight, Loader2, Check, X, RotateCcw, Sparkles, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateQuiz, saveQuizAttempt } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/quiz")({
  head: () => ({ meta: [{ title: "Quizzes — PlacementIQ" }] }),
  component: Quiz,
});


const categories = [
  { name: "Java", diff: "Intermediate", color: "from-orange-500/40 to-red-500/20" },
  { name: "Python", diff: "Intermediate", color: "from-blue-500/40 to-cyan-500/20" },
  { name: "DSA", diff: "Hard", color: "from-purple-500/40 to-pink-500/20" },
  { name: "DBMS", diff: "Easy", color: "from-green-500/40 to-emerald-500/20" },
  { name: "Operating Systems", diff: "Intermediate", color: "from-yellow-500/40 to-orange-500/20" },
  { name: "Computer Networks", diff: "Easy", color: "from-cyan-500/40 to-blue-500/20" },
  { name: "Aptitude", diff: "Easy", color: "from-pink-500/40 to-rose-500/20" },
  { name: "System Design", diff: "Hard", color: "from-indigo-500/40 to-purple-500/20" },
] as const;

type Question = { q: string; type?: string; subtopic: string; options: string[]; answer: number; explanation: string };
type Analysis = {
  percentage: number;
  weak_areas: string[];
  strong_areas: string[];
  recommendations: { summary: string; projects: string[]; roadmap: string[]; next_topics: string[] };
} | null;

function Quiz() {
  const [topic, setTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"Easy" | "Intermediate" | "Hard">("Intermediate");
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [details, setDetails] = useState<{ subtopic: string; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const gen = useServerFn(generateQuiz);
  const save = useServerFn(saveQuizAttempt);

  const start = async (t: string, d: "Easy" | "Intermediate" | "Hard") => {
    setTopic(t); setDifficulty(d); setLoading(true);
    setQuestions([]); setIdx(0); setSelected(null); setScore(0); setDetails([]); setDone(false); setAnalysis(null);
    try {
      const res = await gen({ data: { topic: t, difficulty: d, count: 5 } });
      if (!res.questions.length) throw new Error("Could not generate questions");
      setQuestions(res.questions);
      setAdaptiveDifficulty(res.adaptive_difficulty ?? d);
      if (res.adaptive_difficulty && res.adaptive_difficulty !== d) {
        toast.success(`Adapted to ${res.adaptive_difficulty} based on your history`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate quiz");
      setTopic(null);
    } finally { setLoading(false); }
  };

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const q = questions[idx];
    const correct = i === q.answer;
    if (correct) setScore(s => s + 1);
    setDetails(d => [...d, { subtopic: q.subtopic, correct }]);
  };

  const next = async () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
      setAnalyzing(true);
      try {
        const res = await save({ data: {
          topic: topic!,
          difficulty: adaptiveDifficulty || difficulty,
          score, total: questions.length,
          questionDetails: details,
        }});
        setAnalysis(res as Analysis);
      } catch (e: any) {
        toast.error(e?.message ?? "Could not save attempt");
      } finally { setAnalyzing(false); }
      return;
    }
    setIdx(idx + 1); setSelected(null);
  };

  const reset = () => { setTopic(null); setQuestions([]); setDone(false); setAnalysis(null); };

  if (topic && (loading || questions.length > 0)) {
    return (
      <DashboardShell title={`${topic} · ${adaptiveDifficulty || difficulty}`} subtitle="AI-personalized quiz · adaptive difficulty">
        <div className="max-w-3xl mx-auto">
          {loading && (
            <div className="glass-strong neon-border rounded-2xl p-12 text-center">
              <Loader2 className="size-8 animate-spin text-neon mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Personalizing questions from your profile, ATS report & history…</p>
            </div>
          )}

          {!loading && done && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-strong neon-border rounded-2xl p-8 space-y-6">
              <div className="text-center">
                <Trophy className="size-12 text-neon mx-auto mb-3" />
                <p className="text-xs uppercase tracking-widest text-neon-2">Quiz Complete</p>
                <p className="text-6xl font-display font-bold text-gradient mt-3">{score}/{questions.length}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {score === questions.length ? "Perfect! 🚀" : score >= questions.length / 2 ? "Solid effort — keep going." : "Time to revise — you got this."}
                </p>
              </div>

              {analyzing && (
                <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Analyzing your performance with AI…
                </div>
              )}

              {analysis && (
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-2"><TrendingUp className="size-3" /> Strong Areas</p>
                    {analysis.strong_areas.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.strong_areas.map(s => <span key={s} className="text-xs glass rounded-full px-2.5 py-1 border border-emerald-500/30">{s}</span>)}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">Keep practicing to identify strengths.</p>}
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs uppercase tracking-widest text-red-400 flex items-center gap-1.5 mb-2"><TrendingDown className="size-3" /> Weak Areas</p>
                    {analysis.weak_areas.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.weak_areas.map(s => <span key={s} className="text-xs glass rounded-full px-2.5 py-1 border border-red-500/30">{s}</span>)}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">No major gaps detected.</p>}
                  </div>

                  {analysis.recommendations?.summary && (
                    <div className="glass rounded-xl p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-widest text-neon-2 flex items-center gap-1.5 mb-2"><Sparkles className="size-3" /> AI Verdict</p>
                      <p className="text-sm">{analysis.recommendations.summary}</p>
                    </div>
                  )}

                  {analysis.recommendations?.next_topics?.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs uppercase tracking-widest text-neon-2 mb-2">Recommended Topics</p>
                      <ul className="text-sm space-y-1">
                        {analysis.recommendations.next_topics.map(t => <li key={t} className="flex gap-2"><ChevronRight className="size-3.5 mt-0.5 text-neon" />{t}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations?.projects?.length > 0 && (
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs uppercase tracking-widest text-neon-2 mb-2 flex items-center gap-1.5"><Lightbulb className="size-3" /> Project Ideas</p>
                      <ul className="text-sm space-y-1">
                        {analysis.recommendations.projects.map(p => <li key={p} className="flex gap-2"><ChevronRight className="size-3.5 mt-0.5 text-neon" />{p}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations?.roadmap?.length > 0 && (
                    <div className="glass rounded-xl p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-widest text-neon-2 mb-2">Suggested Roadmap</p>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        {analysis.recommendations.roadmap.map((r, i) => <li key={i}>{r}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <button onClick={() => start(topic, difficulty)} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-white glow font-semibold flex items-center gap-2">
                  <RotateCcw className="size-4" /> New personalized quiz
                </button>
                <button onClick={reset} className="px-5 py-2.5 rounded-xl glass hover:bg-white/10">Pick another</button>

              </div>
            </motion.div>
          )}

          {!loading && !done && questions.length > 0 && (
            <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="glass-strong neon-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 text-xs">
                <span className="glass rounded-full px-3 py-1">Question {idx + 1} / {questions.length}</span>
                <span className="glass rounded-full px-3 py-1 flex items-center gap-1.5"><Trophy className="size-3" /> {score}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden mb-6">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
              </div>
              <h3 className="text-lg font-display font-semibold mb-5 leading-snug">{questions[idx].q}</h3>
              <div className="space-y-2">
                {questions[idx].options.map((opt, i) => {
                  const correct = i === questions[idx].answer;
                  const chosen = selected === i;
                  const reveal = selected !== null;
                  return (
                    <button key={i} onClick={() => choose(i)} disabled={reveal}
                      className={`w-full text-left glass rounded-xl px-4 py-3 text-sm transition flex items-center justify-between ${
                        reveal && correct ? "border border-emerald-500/60 bg-emerald-500/10" :
                        reveal && chosen && !correct ? "border border-red-500/60 bg-red-500/10" :
                        "hover:bg-white/10"
                      }`}>
                      <span>{opt}</span>
                      {reveal && correct && <Check className="size-4 text-emerald-400" />}
                      {reveal && chosen && !correct && <X className="size-4 text-red-400" />}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-5 glass rounded-xl p-4 text-sm">
                    <p className="text-xs uppercase text-neon-2 tracking-widest mb-1">Explanation</p>
                    <p>{questions[idx].explanation}</p>
                    <button onClick={next} className="mt-3 px-4 py-2 rounded-lg bg-gradient-primary text-white text-xs glow flex items-center gap-1">
                      {idx + 1 >= questions.length ? "See results" : "Next question"} <ChevronRight className="size-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Quiz Arena" subtitle="AI-generated quizzes · adaptive difficulty">
      <div className="glass-strong neon-border rounded-2xl p-6 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Difficulty:</span>
        {(["Easy", "Intermediate", "Hard"] as const).map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`text-xs rounded-full px-4 py-1.5 transition ${
              difficulty === d ? "bg-gradient-primary text-white glow" : "glass hover:bg-white/10"
            }`}>{d}</button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
          <Brain className="size-3 text-neon" /> 5 questions · ~5 min
        </span>
      </div>

      <h3 className="font-display font-bold text-lg mb-3">Pick a topic</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((c) => (
          <motion.button
            key={c.name}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => start(c.name, difficulty)}
            className="glass neon-border rounded-2xl p-5 cursor-pointer relative overflow-hidden text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-50`} />
            <div className="relative">
              <Brain className="size-6 text-white mb-3" />
              <h4 className="font-display font-bold text-lg">{c.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">Default: {c.diff}</p>
              <span className="mt-4 text-xs glass rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                Start <ChevronRight className="size-3" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </DashboardShell>
  );
}
