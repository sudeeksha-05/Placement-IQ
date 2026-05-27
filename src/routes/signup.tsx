import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — PlacementIQ" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Welcome to PlacementIQ.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background bg-hero relative grid place-items-center px-4 py-12">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md glass-strong neon-border rounded-3xl p-8 glow"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center glow">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            Placement<span className="text-gradient">IQ</span>
          </span>
        </Link>

        <h1 className="text-2xl font-display font-bold text-center">Create your account</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Start your AI-powered prep in seconds
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Field icon={User} type="text" placeholder="Aditi Sharma" label="Full Name"
            value={name} onChange={(e: any) => setName(e.target.value)} required />
          <Field icon={Mail} type="email" placeholder="you@college.edu" label="Email"
            value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Field icon={Lock} type="password" placeholder="At least 6 characters" label="Password"
            value={password} onChange={(e: any) => setPassword(e.target.value)} required />

          <button
            type="submit"
            disabled={loading}
            className="block text-center w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold glow hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin inline" /> : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gradient font-semibold">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, label, ...props }: any) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5 focus-within:ring-2 ring-primary transition">
        <Icon className="size-4 text-muted-foreground" />
        <input
          {...props}
          className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
