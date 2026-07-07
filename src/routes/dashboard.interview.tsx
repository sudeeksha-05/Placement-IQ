import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Mic, MicOff, MessageSquareCode, Play, Loader2, Send, RotateCcw, Radio, PhoneOff, Sparkles, Volume2, Award, Download, Camera, CameraOff, Activity, Eye, Sun, MonitorUp, MonitorOff, RefreshCw, AlertTriangle, Lock, Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { interviewTurn, liveInterviewNext, liveInterviewReport } from "@/lib/ai.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<LiveMsg[]>([]);
  const [interimText, setInterimText] = useState("");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState<any | null>(null);
  const [reporting, setReporting] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);

  // Camera guidance
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [camInitializing, setCamInitializing] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string>("");
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  // Screen sharing
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [screenActive, setScreenActive] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const [guidance, setGuidance] = useState<{ lighting: "good"|"ok"|"low"; centering: "good"|"ok"|"off"; motion: "calm"|"active"|"high"; tips: string[] }>({
    lighting: "ok", centering: "ok", motion: "calm", tips: [],
  });

  const startedAt = useRef<number>(0);
  const turnsRemaining = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const transcriptRef = useRef<LiveMsg[]>([]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { mutedRef.current = muted; audioStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !muted); }, [muted]);

  // timer
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [active]);

  // camera guidance loop (lightweight: brightness + face box heuristic + motion)
  useEffect(() => {
    if (!active || !cameraEnabled || !camReady) return;
    const canvas = document.createElement("canvas");
    canvas.width = 160; canvas.height = 120;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let prev: Uint8ClampedArray | null = null;
    const iv = setInterval(() => {
      const v = videoRef.current;
      if (!v || !ctx || v.videoWidth === 0) return;
      try {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = img.data;
        // Brightness + skin-tone centroid + motion
        let sum = 0;
        let sx = 0, sy = 0, sc = 0;
        let motion = 0;
        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = 0; x < canvas.width; x += 2) {
            const i = (y * canvas.width + x) * 4;
            const r = d[i], g = d[i+1], b = d[i+2];
            const lum = (r*299 + g*587 + b*114) / 1000;
            sum += lum;
            // rough skin detection
            if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r-g) > 15) {
              sx += x; sy += y; sc++;
            }
            if (prev) {
              const dl = Math.abs(lum - ((prev[i]*299 + prev[i+1]*587 + prev[i+2]*114)/1000));
              motion += dl;
            }
          }
        }
        const pxCount = (canvas.width/2) * (canvas.height/2);
        const brightness = sum / pxCount;
        const motionAvg = prev ? motion / pxCount : 0;
        prev = new Uint8ClampedArray(d);

        const lighting: "good"|"ok"|"low" = brightness > 110 ? "good" : brightness > 65 ? "ok" : "low";
        let centering: "good"|"ok"|"off" = "off";
        const tips: string[] = [];
        if (sc > 40) {
          const cx = sx / sc / canvas.width;   // 0..1
          const cy = sy / sc / canvas.height;
          const dx = Math.abs(cx - 0.5);
          const dy = Math.abs(cy - 0.45);
          centering = dx < 0.12 && dy < 0.15 ? "good" : dx < 0.22 && dy < 0.25 ? "ok" : "off";
          if (cx < 0.35) tips.push("Move slightly to your right — face is off to the left.");
          else if (cx > 0.65) tips.push("Move slightly to your left — face is off to the right.");
          if (cy > 0.65) tips.push("Sit up straighter — you're low in the frame.");
        } else {
          tips.push("Face not detected — center yourself in the camera.");
        }
        if (lighting === "low") tips.push("Improve lighting — face a window or add a lamp.");
        else if (lighting === "ok") tips.push("Lighting is okay — brighter would look more confident.");
        const motionState: "calm"|"active"|"high" = motionAvg < 4 ? "calm" : motionAvg < 12 ? "active" : "high";
        if (motionState === "high") tips.push("Reduce movement — try to stay steady while answering.");

        setGuidance({ lighting, centering, motion: motionState, tips: tips.slice(0, 3) });
      } catch { /* ignore */ }
    }, 1500);
    return () => clearInterval(iv);
  }, [active, cameraEnabled, camReady]);

  // lip-sync animation while speaking
  useEffect(() => {
    if (status !== "speaking") { setMouthOpen(0); return; }
    const iv = setInterval(() => setMouthOpen(Math.random() * 0.9 + 0.1), 90);
    return () => clearInterval(iv);
  }, [status]);

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

  const isSecure = useMemo(() => typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"), []);

  const listCameras = useCallback(async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter(d => d.kind === "videoinput");
      setVideoDevices(cams);
      if (cams.length && !selectedCamId) setSelectedCamId(cams[0].deviceId);
    } catch { /* ignore */ }
  }, [selectedCamId]);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (!cameraEnabled) return true;
    if (!isSecure) {
      setCamError("Camera requires HTTPS or localhost. This page is served over an insecure origin.");
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Your browser does not support camera access (MediaDevices API missing).");
      return false;
    }
    setCamInitializing(true);
    setCamError(null);
    try {
      // stop existing tracks before switching
      streamRef.current?.getTracks().forEach(t => t.stop());
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamReady(true);
      const track = stream.getVideoTracks()[0];
      if (track?.getSettings) {
        const s = track.getSettings();
        if (s.deviceId) setSelectedCamId(s.deviceId);
      }
      await listCameras();
      return true;
    } catch (e: any) {
      const name = e?.name || "";
      let msg = e?.message || "Camera access failed.";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") msg = "Camera permission denied. Enable it in your browser's site settings and click Retry.";
      else if (name === "NotFoundError" || name === "DevicesNotFoundError") msg = "No camera detected on this device.";
      else if (name === "NotReadableError" || name === "TrackStartError") msg = "Camera is already in use by another application.";
      else if (name === "OverconstrainedError") msg = "Selected camera doesn't support the requested resolution.";
      setCamError(msg);
      setCamReady(false);
      return false;
    } finally {
      setCamInitializing(false);
    }
  }, [cameraEnabled, isSecure, listCameras]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false);
  }, []);

  const toggleCameraLive = useCallback(async () => {
    if (camReady) {
      stopCamera();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      await startCamera(selectedCamId || undefined);
    }
  }, [camReady, stopCamera, startCamera, selectedCamId]);

  const switchCamera = useCallback(async (deviceId: string) => {
    setSelectedCamId(deviceId);
    setShowDeviceMenu(false);
    await startCamera(deviceId);
  }, [startCamera]);

  const startScreenShare = useCallback(async () => {
    if (!isSecure) { setScreenError("Screen sharing requires HTTPS or localhost."); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setScreenError("Screen sharing isn't supported in this browser.");
      return;
    }
    setScreenError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" } as any,
        audio: false,
      });
      screenStreamRef.current = stream;
      setScreenActive(true);
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
        await screenRef.current.play().catch(() => {});
      }
      const track = stream.getVideoTracks()[0];
      const surface = (track?.getSettings?.() as any)?.displaySurface;
      if (surface && surface !== "monitor") {
        toast.info(`Sharing ${surface} — full screen sharing gives the best experience.`);
      }
      track?.addEventListener("ended", () => {
        screenStreamRef.current = null;
        setScreenActive(false);
        if (screenRef.current) screenRef.current.srcObject = null;
        toast.warning("Screen sharing ended. The interview will continue.");
      });
    } catch (e: any) {
      if (e?.name !== "NotAllowedError") setScreenError(e?.message || "Screen sharing failed.");
    }
  }, [isSecure]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (screenRef.current) screenRef.current.srcObject = null;
    setScreenActive(false);
  }, []);

  // Detect tab-away while interviewing
  useEffect(() => {
    if (!active) return;
    const onVis = () => { if (document.visibilityState === "hidden") toast.warning("Please stay on this tab during the interview."); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active]);

  const runConversation = async (openingMs: LiveMsg[]) => {
    let history = [...openingMs];
    while (activeRef.current && turnsRemaining.current > 0) {
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

      if (mutedRef.current) {
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
    setStatus("idle");
    if (activeRef.current) await finalizeReport(history);
    activeRef.current = false;
    setActive(false);
    stopCamera();
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
    if (!isSecure) {
      toast.error("This site must be served over HTTPS (or localhost) to use camera and microphone.");
      return;
    }
    if (!supportsSTT) {
      toast.error("Live voice interview requires Chrome or Edge browser.");
      return;
    }
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = micStream;
    } catch (e: any) {
      const name = e?.name || "";
      if (name === "NotAllowedError") toast.error("Microphone permission denied. Enable it in your browser's site settings.");
      else if (name === "NotFoundError") toast.error("No microphone detected on this device.");
      else toast.error("Microphone permission is required.");
      return;
    }
    if (cameraEnabled) await startCamera(selectedCamId || undefined);
    setReport(null); setTranscript([]); setElapsed(0);
    startedAt.current = Date.now();
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
    stopCamera();
    stopScreenShare();
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
    audioStreamRef.current = null;
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

  // Live voice metrics derived from candidate transcript
  const voiceMetrics = useMemo(() => {
    const words = transcript.filter(m => m.speaker === "candidate").flatMap(m => m.text.split(/\s+/).filter(Boolean));
    const total = words.length;
    const fillers = ["um","uh","like","basically","actually","you","know","so","literally","kinda","sorta"];
    const fillerCount = words.filter(w => fillers.includes(w.toLowerCase().replace(/[.,?!]/g,""))).length;
    const speakingSec = Math.max(1, elapsed * 0.55);
    const wpm = Math.round((total / speakingSec) * 60);
    const fillerPct = total ? Math.round((fillerCount / total) * 100) : 0;
    return { wpm, fillerCount, fillerPct, total };
  }, [transcript, elapsed]);

  const mmss = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const statusColor = status === "speaking" ? "bg-neon" : status === "listening" ? "bg-emerald-400" : status === "thinking" ? "bg-amber-400" : "bg-muted-foreground/40";
  const statusLabel = status === "speaking" ? "Speaking" : status === "listening" ? "Listening" : status === "thinking" ? "Thinking" : "Idle";

  const tone = (v: "good"|"ok"|"low"|"off"|"calm"|"active"|"high") => {
    if (v === "good" || v === "calm") return "text-emerald-400 bg-emerald-400/10";
    if (v === "ok" || v === "active") return "text-amber-400 bg-amber-400/10";
    return "text-orange-400 bg-orange-400/10";
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center glow">
          <Radio className="size-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl">AI Live Interview</h2>
          <p className="text-sm text-muted-foreground">Voice + camera, resume-personalized, real-time coaching</p>
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
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button onClick={() => setCameraEnabled(v => !v)}
              className={`text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1 ${cameraEnabled ? "text-emerald-400" : "text-muted-foreground"}`}>
              {cameraEnabled ? <Camera className="size-3" /> : <CameraOff className="size-3" />}
              {cameraEnabled ? "Camera on" : "Camera off"}
            </button>
            <span className="text-xs text-muted-foreground">Camera & screen share are requested only after you click Start.</span>
          </div>
          {!isSecure && (
            <div className="mt-3 rounded-lg bg-orange-400/10 text-orange-400 text-xs px-3 py-2 flex items-center gap-2">
              <Lock className="size-3.5" /> This page must be served over HTTPS (or localhost) for camera, microphone, and screen sharing to work.
            </div>
          )}
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
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block size-2.5 rounded-full ${statusColor} animate-pulse`} />
              <span className="text-sm font-semibold">{statusLabel}</span>
              <span className="text-xs text-muted-foreground">· {type} · {difficulty}{company !== "Any" && ` · ${company}`}</span>
              <div className="flex items-center gap-1 ml-2">
                {camReady && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">Camera</span>}
                {!muted && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">Mic</span>}
                {screenActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon/10 text-neon">Screen sharing</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs glass rounded-full px-3 py-1.5 font-mono">{mmss(elapsed)}</div>
              <button onClick={toggleCameraLive} title={camReady ? "Turn camera off" : "Turn camera on"}
                className={`text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1 ${camReady ? "text-emerald-400" : "text-muted-foreground"}`}>
                {camReady ? <Camera className="size-3" /> : <CameraOff className="size-3" />} {camReady ? "Camera" : "Camera off"}
              </button>
              {videoDevices.length > 1 && camReady && (
                <div className="relative">
                  <button onClick={() => setShowDeviceMenu(v => !v)} className="text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1">
                    <Settings className="size-3" /> Switch
                  </button>
                  {showDeviceMenu && (
                    <div className="absolute right-0 mt-1 w-56 glass-strong neon-border rounded-lg p-1 z-20">
                      {videoDevices.map(d => (
                        <button key={d.deviceId} onClick={() => switchCamera(d.deviceId)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-white/10 ${d.deviceId === selectedCamId ? "text-neon-2" : ""}`}>
                          {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={screenActive ? stopScreenShare : startScreenShare}
                className={`text-xs glass rounded-full px-3 py-1.5 flex items-center gap-1 ${screenActive ? "text-neon" : ""}`}>
                {screenActive ? <MonitorOff className="size-3" /> : <MonitorUp className="size-3" />} {screenActive ? "Stop share" : "Share screen"}
              </button>
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

          <div className="grid lg:grid-cols-12 gap-4">
            {/* Interviewer avatar */}
            <div className="lg:col-span-4 glass rounded-xl p-4 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[10px] uppercase tracking-widest text-neon-2">AI Interviewer</div>
              <div className="relative">
                <motion.div
                  animate={{ scale: status === "speaking" ? [1, 1.04, 1] : 1 }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="size-36 rounded-full bg-gradient-primary grid place-items-center glow relative"
                >
                  {/* Simple face with lip-sync mouth */}
                  <svg viewBox="0 0 100 100" className="size-28">
                    <circle cx="35" cy="42" r="4" fill="white" />
                    <circle cx="65" cy="42" r="4" fill="white" />
                    <motion.ellipse
                      cx="50"
                      cy="65"
                      rx="12"
                      ry={status === "speaking" ? 3 + mouthOpen * 7 : status === "listening" ? 2 : 4}
                      fill="white"
                    />
                  </svg>
                  <div className={`absolute inset-0 rounded-full ${status === "speaking" ? "ring-4 ring-primary/40 animate-ping" : ""}`} />
                </motion.div>
              </div>
              <p className="mt-3 text-sm font-semibold flex items-center gap-1.5">
                <Volume2 className="size-3.5" /> {statusLabel}…
              </p>
              {status === "listening" && (
                <button onClick={stopListeningEarly} className="mt-3 text-xs glass rounded-full px-3 py-1.5">
                  I'm done answering
                </button>
              )}
            </div>

            {/* Camera + guidance */}
            <div className="lg:col-span-4 glass rounded-xl p-4 flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest text-neon-2">Your camera</div>
                <div className={`text-[10px] px-2 py-0.5 rounded-full ${camReady ? "bg-emerald-400/10 text-emerald-400" : camError ? "bg-orange-400/10 text-orange-400" : "bg-muted-foreground/10 text-muted-foreground"}`}>
                  {camReady ? "Live" : camInitializing ? "Starting…" : camError ? "Error" : cameraEnabled ? "Waiting" : "Off"}
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-black/60 aspect-video">
                <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {!camReady && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground p-3 text-center">
                    {camInitializing ? (
                      <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Requesting camera…</div>
                    ) : camError ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-orange-400"><AlertTriangle className="size-3.5" /> {camError}</div>
                        <button onClick={() => startCamera(selectedCamId || undefined)}
                          className="mx-auto text-[11px] glass rounded-full px-3 py-1 flex items-center gap-1 hover:bg-white/10">
                          <RefreshCw className="size-3" /> Retry
                        </button>
                      </div>
                    ) : cameraEnabled ? "Waiting for camera…" : "Camera disabled"}
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className={`rounded-lg px-2 py-1.5 flex items-center gap-1.5 ${tone(guidance.lighting)}`}>
                  <Sun className="size-3" /> Light: {guidance.lighting}
                </div>
                <div className={`rounded-lg px-2 py-1.5 flex items-center gap-1.5 ${tone(guidance.centering)}`}>
                  <Eye className="size-3" /> Frame: {guidance.centering}
                </div>
                <div className={`rounded-lg px-2 py-1.5 flex items-center gap-1.5 ${tone(guidance.motion)}`}>
                  <Activity className="size-3" /> Motion: {guidance.motion}
                </div>
              </div>
              {guidance.tips.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground list-disc pl-4">
                  {guidance.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
              <div className="mt-auto pt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className="glass rounded-lg px-2 py-1.5 text-center">
                  <div className="text-muted-foreground text-[9px] uppercase">WPM</div>
                  <div className="font-bold">{voiceMetrics.wpm || 0}</div>
                </div>
                <div className="glass rounded-lg px-2 py-1.5 text-center">
                  <div className="text-muted-foreground text-[9px] uppercase">Fillers</div>
                  <div className={`font-bold ${voiceMetrics.fillerPct > 8 ? "text-orange-400" : "text-emerald-400"}`}>{voiceMetrics.fillerCount}</div>
                </div>
                <div className="glass rounded-lg px-2 py-1.5 text-center">
                  <div className="text-muted-foreground text-[9px] uppercase">Words</div>
                  <div className="font-bold">{voiceMetrics.total}</div>
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="lg:col-span-4 glass rounded-xl p-4 max-h-[420px] overflow-y-auto">
              <h3 className="text-xs uppercase tracking-widest text-neon-2 mb-3">Live transcript</h3>
              <div className="space-y-3">
                {transcript.map((m, i) => (
                  <div key={i} className={`text-sm ${m.speaker === "interviewer" ? "" : "pl-4 border-l-2 border-emerald-400/30"}`}>
                    <span className={`text-xs font-semibold ${m.speaker === "interviewer" ? "text-neon-2" : "text-emerald-400"}`}>
                      {m.speaker === "interviewer" ? "Interviewer" : "You"}:
                    </span>{" "}
                    <span className="text-foreground/90">{m.text}</span>
                  </div>
                ))}
                {status === "listening" && interimText && (
                  <div className="text-sm pl-4 italic text-muted-foreground border-l-2 border-emerald-400/20">
                    <span className="text-xs font-semibold text-emerald-400/70">You:</span> {interimText}…
                  </div>
                )}
                {transcript.length === 0 && (
                  <p className="text-xs text-muted-foreground">Waiting for the interviewer to greet you…</p>
                )}
              </div>
            </div>
          </div>

          {(screenActive || screenError) && (
            <div className="mt-4 glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest text-neon flex items-center gap-1.5">
                  <MonitorUp className="size-3" /> Shared screen preview
                </div>
                {screenActive ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon/10 text-neon flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-neon animate-pulse" /> Screen sharing active
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-400/10 text-orange-400">Not sharing</span>
                )}
              </div>
              {screenActive ? (
                <div className="relative rounded-lg overflow-hidden bg-black/60 aspect-video max-h-[360px]">
                  <video ref={screenRef} playsInline muted autoPlay className="w-full h-full object-contain" />
                </div>
              ) : screenError ? (
                <div className="text-xs text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="size-3.5" /> {screenError}
                  <button onClick={startScreenShare} className="ml-auto text-[11px] glass rounded-full px-3 py-1 flex items-center gap-1 hover:bg-white/10">
                    <RefreshCw className="size-3" /> Retry
                  </button>
                </div>
              ) : null}
            </div>
          )}
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
        {report.listening_analysis && (
          <div className="glass rounded-xl p-4 md:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <h4 className="text-xs uppercase tracking-widest text-neon-2">Listening analysis</h4>
              <span className="text-xs text-muted-foreground">Attentiveness: <span className="text-foreground/90 font-semibold capitalize">{report.listening_analysis.attentiveness}</span></span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <ScorePill label="Comprehension" value={report.listening_analysis.comprehension_score} />
              <ScorePill label="Answered fully" value={report.listening_analysis.answered_what_asked_percent} />
              <div className="glass rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-neon-2">{report.listening_analysis.clarifications_requested}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Clarifications</div>
              </div>
            </div>
            {report.listening_analysis.observations?.length > 0 && (
              <ul className="space-y-1 text-sm mb-2">
                {report.listening_analysis.observations.map((o: string, i: number) => <li key={i}><span className="text-neon-2">• </span>{o}</li>)}
              </ul>
            )}
            {report.listening_analysis.misinterpretations?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs uppercase tracking-widest text-orange-400 mb-1">Misinterpretations</p>
                <ul className="space-y-1 text-sm">
                  {report.listening_analysis.misinterpretations.map((m: string, i: number) => <li key={i} className="text-foreground/80">→ {m}</li>)}
                </ul>
              </div>
            )}
            {report.listening_analysis.tips?.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs list-disc pl-4 text-muted-foreground">
                {report.listening_analysis.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
              </ul>
            )}
          </div>
        )}
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
    <DashboardShell title="Mock Interview" subtitle="Practice with AI · manual typed round or full voice + camera live simulation">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="glass rounded-xl p-1 h-auto">
          <TabsTrigger value="manual" className="px-4 py-2 text-sm data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <MessageSquareCode className="size-4 mr-1.5" /> Manual Interview
          </TabsTrigger>
          <TabsTrigger value="live" className="px-4 py-2 text-sm data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
            <Radio className="size-4 mr-1.5" /> AI Live Interview
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-neon/20 text-neon">LIVE</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="mt-6">
          <DemoInterview />
        </TabsContent>
        <TabsContent value="live" className="mt-6">
          <LiveInterview />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
