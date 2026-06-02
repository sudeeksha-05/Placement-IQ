import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminRoot,
});

function AdminRoot() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/admin/login", replace: true }); return; }
      const { data: roles } = await supabase
        .from("user_roles" as any).select("role").eq("user_id", data.user.id);
      const isStaff = ((roles as any[]) || []).some(r => r.role === "admin" || r.role === "super_admin");
      navigate({ to: isStaff ? "/dashboard/admin" : "/admin/denied", replace: true });
    })();
  }, [navigate]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
