import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRoles([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id);
      if (!cancelled) {
        const rows = (data as any[]) || [];
        setRoles(rows.map(r => r.role));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const isAdmin = roles.includes("admin");
  const isSuperAdmin = roles.includes("super_admin");
  const isStaff = isAdmin || isSuperAdmin;
  return { roles, isAdmin, isSuperAdmin, isStaff, loading };
}
