import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/denied")({
  component: AccessDenied,
});

function AccessDenied() {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass neon-border rounded-3xl p-10 max-w-md w-full text-center"
      >
        <div className="size-20 mx-auto rounded-2xl bg-gradient-to-br from-destructive/40 to-destructive/10 grid place-items-center mb-5 border border-destructive/30">
          <ShieldAlert className="size-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-6">
          You do not have permission to access this page. The admin area is restricted to
          college management, placement officers, and authorized administrators only.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/dashboard" className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold glow flex items-center justify-center gap-2">
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <Link to="/admin/login" className="px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm">
            Sign in as Admin
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
