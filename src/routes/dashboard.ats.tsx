import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, CheckCircle2, AlertTriangle, FileText, Sparkles,
  Loader2, Target, Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume } from "@/lib/ats.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/ats")({
  head: () => ({ meta: [{ title: "Resume ATS — PlacementIQ" }] }),
  component: ATS,
});

const ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "AI / ML Engineer", "Java Developer", "DevOps Engineer",
];

type Resume = {
  id: string; file_name: string; target_role: string; ats_score: number | null;
  detected_skills: string[]; missing_skills: string[];
  suggestions: { ok: boolean; text: string }[]; summary: string | null;
  status: string; created_at: string;
};

function ATS() {
  const { user } = useAuth();
  const analyze = useServerFn(analyzeResume);
  const fileRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState(ROLES[0]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [current, setCurrent] = useState<Resume | null>(null);
  const [history, setHistory] = useState<Resume[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resumes").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20);
    if (data) {
      setHistory(data as any);
      if (!current && data[0]?.status === "complete") setCurrent(data[0] as any);
    }
  }, [user, current]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // uploads used today (rolling 24h count from history)
  const uploadsToday = history.filter((h) => {
    const t = new Date(h.created_at).getTime();
    return Date.now() - t < 24 * 60 * 60 * 1000;
  }).length;
  const dailyLimit = 3;
  const limitReached = uploadsToday >= dailyLimit;

  const handleFile = async (file: File) => {
    if (!user) return;
    if (limitReached) return toast.error(`Daily upload limit reached (${dailyLimit}/${dailyLimit}). Try again tomorrow.`);
    if (file.type !== "application/pdf") return toast.error("Please upload a PDF file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max file size is 5MB");

    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, file);
      if (upErr) throw upErr;

      const { data: row, error: insErr } = await supabase.from("resumes").insert({
        user_id: user.id, file_path: path, file_name: file.name, target_role: role, status: "pending",
      }).select().single();
      if (insErr) throw insErr;

      setUploading(false);
      setAnalyzing(true);
      toast.info("Analyzing resume with AI…");
      const result = await analyze({ data: { resumeId: row.id } });
      const updated = { ...row, ...result, status: "complete" } as any;
      setCurrent(updated);
      toast.success(`ATS score: ${result.ats_score}/100`);
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const onDelete = async (id: string, file_path: string) => {
    await supabase.storage.from("resumes").remove([file_path]);
    await supabase.from("resumes").delete().eq("id", id);
    if (current?.id === id) setCurrent(null);
    loadHistory();
  };

  const busy = uploading || analyzing;

  return (
    <DashboardShell title="Resume ATS Analyzer" subtitle="Upload your resume — AI scores it against your target role">
      <div className="grid lg:grid-cols-5 gap-5">
        {/* LEFT: Upload + target role */}
        <div className="lg:col-span-3 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass neon-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-4 text-neon-2" />
              <span className="text-xs uppercase tracking-widest text-neon-2">Target role</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    r === role
                      ? "bg-gradient-primary text-white glow"
                      : "glass hover:bg-white/10 text-foreground/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass neon-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-neon" />
                <span className="text-xs uppercase tracking-widest text-neon-2">Upload resume</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full glass ${limitReached ? "text-destructive" : "text-muted-foreground"}`}>
                {uploadsToday}/{dailyLimit} uploads today
              </span>
            </div>
            <div
              onDragOver={(e) => { if (!limitReached) { e.preventDefault(); setDragOver(true); } }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                if (limitReached) return;
                const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
              }}
              onClick={() => !busy && !limitReached && fileRef.current?.click()}
              className={`glass-strong rounded-xl p-10 text-center cursor-pointer transition border-2 border-dashed ${
                dragOver ? "border-neon bg-white/5" : "border-white/10 hover:border-neon/60 hover:bg-white/5"
              } ${busy || limitReached ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {busy ? (
                <>
                  <Loader2 className="size-8 mx-auto text-neon mb-3 animate-spin" />
                  <p className="font-medium">{uploading ? "Uploading…" : "AI is analyzing your resume…"}</p>
                  <p className="text-xs text-muted-foreground mt-1">This usually takes 10–20 seconds</p>
                </>
              ) : limitReached ? (
                <>
                  <Upload className="size-8 mx-auto text-destructive mb-3" />
                  <p className="font-medium">Daily upload limit reached ({dailyLimit}/{dailyLimit})</p>
                  <p className="text-xs text-muted-foreground mt-1">Try again tomorrow to track further ATS growth.</p>
                </>
              ) : (
                <>
                  <Upload className="size-8 mx-auto text-neon mb-3" />
                  <p className="font-medium">Drop your PDF here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF only · 5MB max · Version {history.length + 1}</p>
                </>
              )}
            </div>
          </motion.div>

          {current && (
            <ResultPanel resume={current} />
          )}
        </div>

        {/* RIGHT: Score + History */}
        <div className="lg:col-span-2 space-y-5">
          <ScoreCard score={current?.ats_score ?? null} loading={analyzing} />
          <HistoryPanel
            items={history}
            currentId={current?.id}
            onPick={(r) => setCurrent(r)}
            onDelete={onDelete}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

function ScoreCard({ score, loading }: { score: number | null; loading: boolean }) {
  const display = score ?? 0;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (display / 100) * circumference;
  const verdict =
    score == null ? "Awaiting scan" :
    score >= 85 ? "Excellent · Top 10%" :
    score >= 70 ? "Strong · Top 25%" :
    score >= 50 ? "Needs polish" : "Major rework needed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass neon-border rounded-2xl p-6 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-neon-2">ATS Score</p>
      <div className="relative size-44 mx-auto my-3">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90">
          <circle cx="80" cy="80" r="70" stroke="oklch(0.22 0.03 280)" strokeWidth="12" fill="none" />
          <motion.circle
            cx="80" cy="80" r="70" fill="none" strokeWidth="12" strokeLinecap="round"
            stroke="url(#grad)"
            strokeDasharray={circumference}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.27 300)" />
              <stop offset="100%" stopColor="oklch(0.7 0.2 220)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          {loading ? (
            <Loader2 className="size-8 animate-spin text-neon" />
          ) : (
            <div>
              <p className="text-5xl font-display font-bold text-gradient">{score ?? "—"}</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-neon-2">{verdict}</p>
    </motion.div>
  );
}

function ResultPanel({ resume }: { resume: Resume }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={resume.id}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="space-y-5"
      >
        {resume.summary && (
          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-neon" /> AI Verdict
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-1 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-neon-2" /> Detected Skills
            </h3>
            <p className="text-xs text-muted-foreground mb-4">{resume.detected_skills.length} found</p>
            <div className="flex flex-wrap gap-2">
              {resume.detected_skills.length === 0 ? (
                <p className="text-xs text-muted-foreground">No skills detected</p>
              ) : resume.detected_skills.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-neon-2/30 text-neon-2">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-1 flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" /> Missing Keywords
            </h3>
            <p className="text-xs text-muted-foreground mb-4">For {resume.target_role}</p>
            <div className="flex flex-wrap gap-2">
              {resume.missing_skills.length === 0 ? (
                <p className="text-xs text-muted-foreground">No gaps detected 🎉</p>
              ) : resume.missing_skills.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-lg glass border border-destructive/30 text-destructive">
                  + {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {resume.suggestions?.length > 0 && (
          <div className="glass neon-border rounded-2xl p-6">
            <h3 className="font-display font-bold mb-4">Improvement Suggestions</h3>
            <ul className="space-y-3">
              {resume.suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 glass rounded-xl p-3">
                  {s.ok ? (
                    <CheckCircle2 className="size-4 text-neon-2 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm">{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function HistoryPanel({
  items, currentId, onPick, onDelete,
}: {
  items: Resume[]; currentId?: string;
  onPick: (r: Resume) => void; onDelete: (id: string, path: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass neon-border rounded-2xl p-6"
    >
      <h3 className="font-display font-bold mb-4 flex items-center gap-2">
        <FileText className="size-4" /> History
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No scans yet — upload your first resume.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {items.map((h) => (
            <button
              key={h.id}
              onClick={() => h.status === "complete" && onPick(h)}
              className={`w-full flex items-center justify-between glass rounded-xl p-3 text-left transition hover:bg-white/10 ${
                h.id === currentId ? "ring-1 ring-neon" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{h.file_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {h.target_role} · {new Date(h.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-3">
                {h.status === "complete" ? (
                  <span className="text-lg font-display font-bold text-gradient">{h.ats_score}</span>
                ) : h.status === "failed" ? (
                  <span className="text-xs text-destructive">failed</span>
                ) : (
                  <Loader2 className="size-3 animate-spin text-neon" />
                )}
                <Trash2
                  onClick={(e) => { e.stopPropagation(); onDelete(h.id, (h as any).file_path); }}
                  className="size-3.5 text-muted-foreground hover:text-destructive cursor-pointer"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
