import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminGate,
});

function AdminGate() {
  const { user } = useAuth();
  const { isAdmin, loading } = useRole();
  const [anyAdmin, setAnyAdmin] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (loading || isAdmin) return;
    (async () => {
      const { count } = await supabase
        .from("user_roles" as any)
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      setAnyAdmin((count ?? 0) > 0);
    })();
  }, [loading, isAdmin]);

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );

  if (!isAdmin) {
    const canClaim = anyAdmin === false && !!user;
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
        <div className="glass neon-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center glow">
            <Shield className="size-7 text-white" />
          </div>
          <h2 className="text-2xl font-display font-bold">Admin Access</h2>
          {canClaim ? (
            <>
              <p className="text-sm text-muted-foreground">
                No administrator exists yet. You can claim ownership of this workspace now.
              </p>
              <button
                disabled={claiming}
                onClick={async () => {
                  setClaiming(true);
                  const { error } = await (supabase as any).rpc("claim_admin");
                  if (error) toast.error(error.message);
                  else { toast.success("You're now an admin"); window.location.reload(); }
                  setClaiming(false);
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {claiming ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Become Admin
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You don't have permission to view this area. Ask an administrator to grant you access.
              </p>
              <Link to="/dashboard" className="inline-block px-4 py-2 rounded-lg glass hover:bg-white/10 text-sm">
                Back to dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
}
