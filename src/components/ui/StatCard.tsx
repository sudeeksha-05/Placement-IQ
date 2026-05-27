import { motion } from "framer-motion";
import { LucideIcon, TrendingUp } from "lucide-react";

export function StatCard({
  label, value, delta, icon: Icon, accent = "primary",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "neon";
}) {
  const accentClass = {
    primary: "from-primary/30 to-primary/0",
    accent: "from-accent/30 to-accent/0",
    neon: "from-neon/30 to-neon/0",
  }[accent];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass neon-border rounded-2xl p-5 relative overflow-hidden"
    >
      <div className={`absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br ${accentClass} blur-2xl`} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-display font-bold mt-2">{value}</p>
          {delta && (
            <p className="text-xs text-neon-2 mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> {delta}
            </p>
          )}
        </div>
        <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center glow">
          <Icon className="size-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
