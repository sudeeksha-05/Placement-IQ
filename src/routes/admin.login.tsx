import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Lock, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: roles } = await supabase
          .from("user_roles" as any).select("role").eq("user_id", data.user.id);
        const isStaff = ((roles as any[]) || []).some(r => r.role === "admin" || r.role === "super_admin");
        if (isStaff) navigate({ to: "/dashboard/admin" });
      }
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Sign-in failed");

      const { data: roles } = await supabase
        .from("user_roles" as any).select("role").eq("user_id", userId);
      const isStaff = ((roles as any[]) || []).some(r => r.role === "admin" || r.role === "super_admin");

      if (!isStaff) {
        await supabase.auth.signOut();
        toast.error("This account does not have admin access");
        navigate({ to: "/admin/denied" });
        return;
      }

      // Audit log
      await supabase.from("admin_audit_logs" as any).insert({
        admin_id: userId,
        action: "admin_login",
        metadata: { email },
      });

      toast.success("Welcome back, admin");
      navigate({ to: "/dashboard/admin" });
    } catch (err: any) {
      toast.error(err.message || "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none -z-10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass neon-border rounded-3xl p-8 max-w-md w-full"
      >
        <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-3" /> Back to site
        </Link>
        <div className="text-center mb-6">
          <div className="size-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center glow mb-4">
            <Shield className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted access — college management & placement officers only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Admin Email</label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@college.edu"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg glass border border-border/50 focus:border-primary outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg glass border border-border/50 focus:border-primary outline-none text-sm"
              />
            </div>
          </div>
          <button
            disabled={submitting}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
            Sign in to Admin
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            Student?{" "}
            <Link to="/login" className="text-primary hover:underline">Use student login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
