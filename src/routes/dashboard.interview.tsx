import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Mic, MicOff, MessageSquareCode, Play, Loader2, Send, RotateCcw, Radio, PhoneOff, Sparkles, Volume2, Award, Download } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { interviewTurn, liveInterviewNext, liveInterviewReport } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — PlacementIQ" }] }),
  component: Interview,
});

/* ================================================================== */
/*                    EXISTING DEMO INTERVIEW (unchanged behavior)     */
/* ================================================================== */
type Turn = { question: string; answer: string; feedback?: { score: number; strengths: string; improvements: string } | null };

const ROUNDS = [
  { i: Video, t: "Technical", d: "DSA + CS fundamentals", color: "from-primary/40 to-accent/20", type: "Technical" as const },
  { i: Mic, t: "HR", d: "Behavioral & culture-fit", color: "from-accent/40 to-neon-2/20", type: "HR" as const },
  { i: MessageSquareCode, t: "Coding", d: "Live problem walkthrough", color: "from-neon/40 to-primary/20", type: "Coding" as const },
];

function DemoInterview() {
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
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs glass rounded-full px-3 py-1.5">{type} · Question {turns.length + 1}</div>
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
                placeholder="Type your answer here…"
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
      </>
    );
  }

  return (
    <>
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
    </>
  );
}

/* ================================================================== */
/*                          NEW: AI LIVE INTERVIEW                     */
/* ================================================================== */
const LIVE_TYPES = ["Technical","HR","Coding","System Design","Behavioral","Project Discussion","Managerial","Final HR","Mixed"] as const;
const LIVE_DIFF = ["Beginner","Intermediate","Advanced","FAANG"] as const;
const COMPANIES = ["Any","Google","Microsoft","Amazon","Meta","Netflix","Adobe","Oracle","Accenture","TCS","Infosys","Wipro","Capgemini","Deloitte"];
const LANGS = ["English","Hindi","Spanish","French","German"];

type LiveMsg = { speaker: "interviewer" | "candidate"; text: string };
type Status = "idle" | "speaking" | "listening" | "thinking";

function useSpeech() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load(); synth.onvoiceschanged = load;
  }, [synth]);
  return { synth, voices };
}

function LiveInterview() {
  const nextFn = useServerFn(liveInterviewNext);
  const reportFn = useServerFn(liveInterviewReport);
  const { synth, voices } = useSpeech();

  const [role, setRole] = useState("Data Analyst");
  const [type, setType] = useState<(typeof LIVE_TYPES)[number]>("Mixed");
  const [difficulty, setDifficulty] = useState<(typeof LIVE_DIFF)[number]>("Intermediate");
  const [company, setCompany] = useState("Any");
  const [language, setLanguage] = useState("English");
  const [durationMin, setDurationMin] = useState(10);

  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<LiveMsg[]>([]);
  const [interimText, setInterimText] = useState("");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState<any | null>(null);
  const [reporting, setReporting] = useState(false);

  const startedAt = useRef<number>(0);
  const turnsRemaining = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const transcriptRef = useRef<LiveMsg[]>([]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // timer
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [active]);

  const supportsSTT = useMemo(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window), []);

  const speak = (text: string) => new Promise<void>((resolve) => {
    if (!synth) return resolve();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { English: "en-US", Hindi: "hi-IN", Spanish: "es-ES", French: "fr-FR", German: "de-DE" };
    u.lang = langMap[language] ?? "en-US";
    const preferred = voices.find(v => v.lang.startsWith(u.lang.split("-")[0]) && /female|natural|google|zira|samantha/i.test(v.name))
      || voices.find(v => v.lang.startsWith(u.lang.split("-")[0]));
    if (preferred) u.voice = preferred;
    u.rate = 1.0; u.pitch = 1.05;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    setStatus("speaking");
    synth.speak(u);
  });

  const startListening = () => new Promise<string>((resolve) => {
    if (!supportsSTT) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return resolve("");
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;
    const langMap: Record<string, string> = { English: "en-US", Hindi: "hi-IN", Spanish: "es-ES", French: "fr-FR", German: "de-DE" };
    rec.lang = langMap[language] ?? "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    let finalText = "";
    let silenceTimer: any = null;
    const resetSilence = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => { try { rec.stop(); } catch {} }, 2200);
    };

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setInterimText(interim);
      resetSilence();
    };
    rec.onerror = () => { /* handled by onend */ };
    rec.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      setInterimText("");
      recognitionRef.current = null;
      resolve(finalText.trim());
    };

    setStatus("listening");
    try { rec.start(); resetSilence(); } catch { resolve(""); }
  });

  const stopListeningEarly = () => {
    try { recognitionRef.current?.stop(); } catch {}
  };

  const runConversation = async (openingMs: LiveMsg[]) => {
    let history = [...openingMs];
    while (activeRef.current && turnsRemaining.current > 0) {
      // AI turn
      setStatus("thinking");
      let ai;
      try {
        ai = await nextFn({
          data: {
            role, type, difficulty,
            company: company === "Any" ? undefined : company,
            language,
            turnsRemaining: turnsRemaining.current,
            history: history.map(h => ({ speaker: h.speaker, text: h.text })),
          },
        });
      } catch (e: any) {
        toast.error(e?.message ?? "AI failed");
        break;
      }
      if (!activeRef.current) break;
      const aiMsg: LiveMsg = { speaker: "interviewer", text: ai.say };
      history = [...history, aiMsg];
      setTranscript(t => [...t, aiMsg]);
      await speak(ai.say);
      turnsRemaining.current -= 1;
      if (ai.done || turnsRemaining.current <= 0) break;
      if (!activeRef.current) break;

      // Candidate turn (unless muted -> pause and skip listening)
      if (mutedRef.current) {
        // wait until unmuted
        while (activeRef.current && mutedRef.current) {
          await new Promise(r => setTimeout(r, 300));
        }
        if (!activeRef.current) break;
      }
      const said = await startListening();
      if (!activeRef.current) break;
      const candMsg: LiveMsg = { speaker: "candidate", text: said || "(no response)" };
      history = [...history, candMsg];
      setTranscript(t => [...t, candMsg]);
    }
    // finalize
    setStatus("idle");
    if (activeRef.current) await finalizeReport(history);
    activeRef.current = false;
    setActive(false);
  };

  const finalizeReport = async (history: LiveMsg[]) => {
    setReporting(true);
    try {
      const r = await reportFn({
        data: {
          role, type, difficulty,
          company: company === "Any" ? undefined : company,
          durationSec: Math.floor((Date.now() - startedAt.current) / 1000),
          transcript: history,
        },
      });
      setReport(r);
    } catch (e: any) {
      toast.error(e?.message ?? "Report failed");
    } finally {
      setReporting(false);
    }
  };

  const start = async () => {
    if (!supportsSTT) {
      toast.error("Live voice interview requires Chrome or Edge browser.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone permission is required.");
      return;
    }
    setReport(null); setTranscript([]); setElapsed(0);
    startedAt.current = Date.now();
    // ~1 turn per minute (question+answer). min 4 turns.
    turnsRemaining.current = Math.max(4, durationMin);
    activeRef.current = true;
    setActive(true);
    setStatus("thinking");
    await runConversation([]);
  };

  const end = () => {
    activeRef.current = false;
    stopListeningEarly();
    try { synth?.cancel(); } catch {}
    setStatus("idle");
    setActive(false);
    if (transcriptRef.current.length > 0 && !report) {
      finalizeReport(transcriptRef.current);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify({ meta: { role, type, difficulty, company, durationSec: elapsed }, transcript, report }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `interview-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const mmss = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const statusColor = status === "speaking" ? "bg-neon" : status === "listening" ? "bg-emerald-400" : status === "thinking" ? "bg-amber-400" : "bg-muted-foreground/40";
  const statusLabel = status === "speaking" ? "Speaking" : status === "listening" ? "Listening" : status === "thinking" ? "Thinking" : "Idle";

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center glow">
          <Radio className="size-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl">AI Live Interview</h2>
          <p className="text-sm text-muted-foreground">Voice-based, resume-personalized, real-time evaluation</p>
        </div>
      </div>

      {!active && !report && (
        <motion.div whileHover={{ y: -2 }} className="glass-strong neon-border rounded-2xl p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Target role">
              <input value={role} onChange={e => setRole(e.target.value)}
                className="w-full glass rounded-lg px-3 py-2 text-sm bg-transparent outline-none" />
            </Field>
            <Field label="Interview type">
              <Select value={type} onChange={v => setType(v as any)} options={LIVE_TYPES as unknown as string[]} />
            </Field>
            <Field label="Difficulty">
              <Select value={difficulty} onChange={v => setDifficulty(v as any)} options={LIVE_DIFF as unknown as string[]} />
            </Field>
            <Field label="Company style">
              <Select value={company} onChange={setCompany} options={COMPANIES} />
            </Field>
            <Field label="Language">
              <Select value={language} onChange={setLanguage} options={LANGS} />
            </Field>
            <Field label={`Duration (${durationMin} min)`}>
              <input type="range" min={4} max={20} value={durationMin} onChange={e => setDurationMin(parseInt(e.target.value,10))} className="w-full" />
            </Field>
          </div>
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Uses your latest resume + profile for personalized questions. Requires microphone. Best in Chrome / Edge.
            </p>
            <button onClick={start}
              className="px-6 py-3 rounded-xl bg-gradient-primary text-white glow font-semibold flex items-center gap-2">
              <Sparkles className="size-4" /> Start Live Interview
            </button>
          </div>
        </motion.div>
      )}

      {active && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong neon-border rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-3">
              <span className={`inline-block size-2.5 rounded-full ${statusColor} animate-pulse`} />
              <span className="text-sm font-semibold">{statusLabel}</span>
              <span className="text-xs text-muted-foreground">· {type} · {difficulty}{company !== "Any" && ` · ${company}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs glass rounded-full px-3 py-1.5 font-mono">{mmss(elapsed)}</div>
              <button onClick={() => setMuted(m => !m)}
                className={`text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1 ${muted ? "text-orange-400" : ""}`}>
                {muted ? <MicOff className="size-3" /> : <Mic className="size-3" />} {muted ? "Muted" : "Mute"}
              </button>
              <button onClick={end}
                className="text-xs rounded-full px-3 py-1.5 flex items-center gap-1 bg-destructive/20 text-destructive hover:bg-destructive/30">
                <PhoneOff className="size-3" /> End
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col items-center justify-center py-6">
              <div className="relative">
                <motion.div
                  animate={{ scale: status === "speaking" ? [1, 1.08, 1] : status === "listening" ? [1, 1.04, 1] : 1 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="size-40 rounded-full bg-gradient-primary grid place-items-center glow"
                >
                  <Volume2 className="size-14 text-white" />
                </motion.div>
                <div className={`absolute inset-0 rounded-full ${status === "speaking" ? "ring-4 ring-primary/40 animate-ping" : ""}`} />
              </div>
              <p className="mt-4 text-sm font-semibold">AI Interviewer</p>
              <p className="text-xs text-muted-foreground">{statusLabel}…</p>
              {status === "listening" && (
                <button onClick={stopListeningEarly} className="mt-4 text-xs glass rounded-full px-3 py-1.5">
                  I'm done answering
                </button>
              )}
            </div>

            <div className="lg:col-span-2 glass rounded-xl p-4 max-h-[55vh] overflow-y-auto">
              <h3 className="text-xs uppercase tracking-widest text-neon-2 mb-3">Live transcript</h3>
              <div className="space-y-3">
                {transcript.map((m, i) => (
                  <div key={i} className={`text-sm ${m.speaker === "interviewer" ? "" : "pl-6"}`}>
                    <span className={`text-xs font-semibold ${m.speaker === "interviewer" ? "text-neon-2" : "text-emerald-400"}`}>
                      {m.speaker === "interviewer" ? "Interviewer" : "You"}:
                    </span>{" "}
                    <span className="text-foreground/90">{m.text}</span>
                  </div>
                ))}
                {status === "listening" && interimText && (
                  <div className="text-sm pl-6 italic text-muted-foreground">
                    <span className="text-xs font-semibold text-emerald-400/70">You:</span> {interimText}…
                  </div>
                )}
                {transcript.length === 0 && (
                  <p className="text-xs text-muted-foreground">Waiting for the interviewer to greet you…</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {(reporting || report) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            {reporting && !report && (
              <div className="glass rounded-2xl p-6 flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" /> Generating your detailed evaluation report…
              </div>
            )}
            {report && <ReportView report={report} onDownload={downloadReport} onReset={() => { setReport(null); setTranscript([]); }} />}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-neon-2">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full glass rounded-lg px-3 py-2 text-sm bg-transparent outline-none appearance-none">
      {options.map(o => <option key={o} value={o} className="bg-background">{o}</option>)}
    </select>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "text-emerald-400" : value >= 50 ? "text-amber-400" : "text-orange-400";
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}
function ReportView({ report, onDownload, onReset }: { report: any; onDownload: () => void; onReset: () => void }) {
  const s = report.scores;
  return (
    <div className="glass-strong neon-border rounded-2xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center glow"><Award className="size-5 text-white" /></div>
          <div>
            <h3 className="font-display font-bold text-xl">Interview Evaluation Report</h3>
            <p className="text-xs text-muted-foreground">Readiness: <span className="text-neon-2 font-bold">{report.readiness_percent}%</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onDownload} className="text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1"><Download className="size-3" /> Export</button>
          <button onClick={onReset} className="text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1"><RotateCcw className="size-3" /> New</button>
        </div>
      </div>

      <p className="text-sm text-foreground/90 mb-5">{report.verdict}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        <ScorePill label="Overall" value={s.overall} />
        <ScorePill label="Technical" value={s.technical} />
        <ScorePill label="Communication" value={s.communication} />
        <ScorePill label="Confidence" value={s.confidence} />
        <ScorePill label="Problem Solving" value={s.problem_solving} />
        <ScorePill label="HR" value={s.hr} />
        <ScorePill label="Project" value={s.project_knowledge} />
        <ScorePill label="Voice Clarity" value={s.voice_clarity} />
        <ScorePill label="Professionalism" value={s.professionalism} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Panel title="Strengths" items={report.strengths} tone="emerald" />
        <Panel title="Areas to improve" items={report.weaknesses} tone="orange" />
        <Panel title="Missed concepts" items={report.missed_concepts} />
        <Panel title="Topics to revise" items={report.topics_to_revise} />
      </div>

      {report.incorrect_answers?.length > 0 && (
        <div className="glass rounded-xl p-4 mb-4">
          <h4 className="text-xs uppercase tracking-widest text-neon-2 mb-2">Answer issues</h4>
          <ul className="space-y-2 text-sm">
            {report.incorrect_answers.map((x: any, i: number) => (
              <li key={i}><span className="text-muted-foreground">Q:</span> {x.question} <br/><span className="text-orange-400 text-xs">→ {x.issue}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs uppercase tracking-widest text-neon-2 mb-2">Learning resources</h4>
          <ul className="space-y-1 text-sm">
            {report.learning_resources?.map((r: any, i: number) => (
              <li key={i}><a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.title}</a> <span className="text-xs text-muted-foreground">· {r.type}</span></li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs uppercase tracking-widest text-neon-2 mb-2">Certifications</h4>
          <ul className="space-y-1 text-sm">
            {report.suggested_certifications?.map((c: any, i: number) => (
              <li key={i}><a href={c.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.name}</a> <span className="text-xs text-muted-foreground">· {c.provider}</span></li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs uppercase tracking-widest text-neon-2 mb-2">Recommended projects</h4>
          <ul className="space-y-1 text-sm list-disc pl-4">
            {report.recommended_projects?.map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs uppercase tracking-widest text-neon-2 mb-2">Speech analysis</h4>
          <p className="text-sm">Pace: <span className="text-foreground/90 font-semibold">{report.speech_analysis?.pace}</span> · Energy: <span className="text-foreground/90 font-semibold">{report.speech_analysis?.energy}</span></p>
          {report.speech_analysis?.tone && <p className="text-sm mt-1">Tone: {report.speech_analysis.tone}</p>}
          {report.speech_analysis?.filler_words?.length > 0 && (
            <p className="text-sm mt-1">Filler words: <span className="text-orange-400">{report.speech_analysis.filler_words.join(", ")}</span></p>
          )}
          {report.speech_analysis?.tips?.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs list-disc pl-4 text-muted-foreground">
              {report.speech_analysis.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
function Panel({ title, items, tone }: { title: string; items?: string[]; tone?: "emerald" | "orange" }) {
  if (!items?.length) return null;
  const dot = tone === "emerald" ? "text-emerald-400" : tone === "orange" ? "text-orange-400" : "text-neon-2";
  return (
    <div className="glass rounded-xl p-4">
      <h4 className="text-xs uppercase tracking-widest text-neon-2 mb-2">{title}</h4>
      <ul className="space-y-1 text-sm">
        {items.map((x, i) => <li key={i}><span className={dot}>• </span>{x}</li>)}
      </ul>
    </div>
  );
}

/* ================================================================== */
/*                              PAGE                                   */
/* ================================================================== */
function Interview() {
  return (
    <DashboardShell title="Mock Interview" subtitle="Practice with AI · text demo or full voice-based live simulation">
      <DemoInterview />
      <LiveInterview />
    </DashboardShell>
  );
}
