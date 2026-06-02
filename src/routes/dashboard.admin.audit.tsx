import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/audit")({
  component: AuditLogs,
});

function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setLogs((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter(l =>
    !filter || l.action?.toLowerCase().includes(filter.toLowerCase())
    || l.target_type?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AdminShell title="Audit Logs" subtitle="Every admin action is recorded here">
      <div className="glass neon-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">{filtered.length} entries</span>
          </div>
          <input
            value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter by action..."
            className="px-3 py-1.5 rounded-lg glass border border-border/50 text-sm outline-none focus:border-primary"
          />
        </div>

        {loading ? (
          <div className="py-12 grid place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No audit entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/30">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Target</th>
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-border/20 hover:bg-white/5">
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{l.action}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{l.target_type || "—"} {l.target_id ? `#${String(l.target_id).slice(0, 8)}` : ""}</td>
                    <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">{String(l.admin_id).slice(0, 8)}…</td>
                    <td className="py-2.5 text-xs text-muted-foreground max-w-md truncate">{JSON.stringify(l.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
