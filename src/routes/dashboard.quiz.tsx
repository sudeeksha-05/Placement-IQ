import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Timer, Trophy, Brain, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/quiz")({
  head: () => ({ meta: [{ title: "Quizzes — PlacementIQ" }] }),
  component: Quiz,
});

const categories = [
  { name: "Java", count: 240, diff: "Intermediate", color: "from-orange-500/40 to-red-500/20" },
  { name: "Python", count: 310, diff: "Intermediate", color: "from-blue-500/40 to-cyan-500/20" },
  { name: "DSA", count: 520, diff: "Hard", color: "from-purple-500/40 to-pink-500/20" },
  { name: "DBMS", count: 180, diff: "Easy", color: "from-green-500/40 to-emerald-500/20" },
  { name: "OS", count: 160, diff: "Intermediate", color: "from-yellow-500/40 to-orange-500/20" },
  { name: "Computer Networks", count: 140, diff: "Easy", color: "from-cyan-500/40 to-blue-500/20" },
  { name: "Aptitude", count: 420, diff: "Easy", color: "from-pink-500/40 to-rose-500/20" },
];

const leaderboard = [
  { rank: 1, name: "Vihaan K.", score: 4820 },
  { rank: 2, name: "Priya S.", score: 4615 },
  { rank: 3, name: "Aditi R. (you)", score: 4480 },
  { rank: 4, name: "Karan M.", score: 4210 },
  { rank: 5, name: "Sneha T.", score: 4090 },
];

function Quiz() {
  return (
    <DashboardShell title="Quiz Arena" subtitle="Timed quizzes · live leaderboard · adaptive difficulty">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <motion.div whileHover={{ y: -2 }} className="lg:col-span-2 glass-strong neon-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest text-neon-2">Daily Challenge</p>
            <h3 className="text-2xl font-display font-bold mt-2">Trees & Graphs Sprint</h3>
            <p className="text-sm text-muted-foreground mt-1">10 questions · 15 min · +200 XP</p>
            <div className="flex gap-4 mt-4 text-xs">
              <span className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5"><Timer className="size-3" /> 15:00</span>
              <span className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5"><Brain className="size-3" /> Hard</span>
              <span className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5"><Trophy className="size-3" /> +200 XP</span>
            </div>
            <button className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-primary text-white glow font-semibold flex items-center gap-2 hover:scale-[1.03] transition">
              Start Challenge <ChevronRight className="size-4" />
            </button>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="glass neon-border rounded-2xl p-6">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-neon" /> Leaderboard
          </h3>
          <ul className="space-y-2">
            {leaderboard.map((l) => (
              <li key={l.rank} className={`flex items-center gap-3 rounded-lg p-2 ${l.name.includes("you") ? "bg-gradient-primary/20 border border-primary/30" : ""}`}>
                <span className={`size-7 grid place-items-center rounded-md text-xs font-bold ${
                  l.rank === 1 ? "bg-yellow-500/30 text-yellow-300" :
                  l.rank === 2 ? "bg-zinc-400/30 text-zinc-200" :
                  l.rank === 3 ? "bg-orange-500/30 text-orange-300" : "glass"
                }`}>{l.rank}</span>
                <span className="text-sm flex-1 truncate">{l.name}</span>
                <span className="text-xs text-neon-2 font-semibold">{l.score}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <h3 className="font-display font-bold text-lg mb-3">Categories</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((c) => (
          <motion.div
            key={c.name}
            whileHover={{ y: -4, scale: 1.02 }}
            className="glass neon-border rounded-2xl p-5 cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-50`} />
            <div className="relative">
              <Brain className="size-6 text-white mb-3" />
              <h4 className="font-display font-bold text-lg">{c.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{c.count} questions · {c.diff}</p>
              <button className="mt-4 text-xs glass rounded-lg px-3 py-1.5 hover:bg-white/10 flex items-center gap-1">
                Start <ChevronRight className="size-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardShell>
  );
}
