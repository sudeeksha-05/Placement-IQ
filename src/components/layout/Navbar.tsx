import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Navbar() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/#features", label: "Features" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/progress", label: "Progress" },
    { to: "/#about", label: "About" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1100px,calc(100%-2rem))]"
    >
      <div className="glass-strong rounded-2xl px-5 py-3 flex items-center justify-between neon-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center glow">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Placement<span className="text-gradient">IQ</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 text-sm rounded-lg bg-gradient-primary text-white font-medium hover:opacity-90 transition glow"
          >
            Sign up
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
