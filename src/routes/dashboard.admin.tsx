import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
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
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading } = useRole();
  const navigate = useNavigate();
  const [anyAdmin, setAnyAdmin] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/admin/login", replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (loading || isStaff || !user) return;
    (async () => {
      const { count } = await supabase
        .from("user_roles" as any)
        .select("*", { count: "exact", head: true })
        .in("role", ["admin", "super_admin"] as any);
      setAnyAdmin((count ?? 0) > 0);
    })();
  }, [loading, isStaff, user]);

  useEffect(() => {
    if (!loading && !isStaff && anyAdmin === true) {
      navigate({ to: "/admin/denied", replace: true });
    }
  }, [loading, isStaff, anyAdmin, navigate]);

  if (authLoading || loading || !user) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );

  if (!isStaff) {
    if (anyAdmin === false) {
      return (
        <div className="min-h-screen grid place-items-center bg-background p-6">
          <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
          <div className="glass neon-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center glow">
              <Shield className="size-7 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold">Claim Workspace</h2>
            <p className="text-sm text-muted-foreground">
              No administrator exists yet. Claim ownership now to become the Super Admin.
            </p>
            <button
              disabled={claiming}
              onClick={async () => {
                setClaiming(true);
                const { error } = await (supabase as any).rpc("claim_admin");
                if (error) toast.error(error.message);
                else { toast.success("You're now Super Admin"); window.location.reload(); }
                setClaiming(false);
              }}
              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {claiming ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Become Super Admin
            </button>
            <Link to="/dashboard" className="inline-block text-xs text-muted-foreground hover:text-foreground">
              Back to dashboard
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
