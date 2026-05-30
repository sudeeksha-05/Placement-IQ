import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/notifications")({
  component: Notifications,
});

const CATEGORIES = [
  { v: "announcement", l: "Announcement" },
  { v: "placement", l: "Placement update" },
  { v: "tips", l: "Interview tips" },
  { v: "reminder", l: "Quiz reminder" },
];

function Notifications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "", category: "announcement", audience: "all" });

  const load = async () => {
    const { data } = await supabase.from("announcements" as any).select("*").order("created_at", { ascending: false });
    setRows((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!form.title || !form.body) return toast.error("Title and body required");
    const { error } = await supabase.from("announcements" as any).insert({ ...form, created_by: user?.id });
    if (error) toast.error(error.message);
    else { toast.success("Announcement sent"); setForm({ title: "", body: "", category: "announcement", audience: "all" }); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("announcements" as any).delete().eq("id", id); load();
  };

  return (
    <AdminShell title="Notifications" subtitle="Broadcast updates to users">
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 glass neon-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center glow"><Megaphone className="size-4 text-white"/></div>
            <h3 className="font-display font-semibold">New Broadcast</h3>
          </div>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full glass rounded-lg px-3 py-2 text-sm"/>
          <textarea placeholder="Message body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="w-full glass rounded-lg px-3 py-2 text-sm" rows={6}/>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full glass rounded-lg px-3 py-2 text-sm bg-card">
            {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
          <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full glass rounded-lg px-3 py-2 text-sm bg-card">
            <option value="all">All users</option>
          </select>
          <button onClick={send} className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold glow flex items-center justify-center gap-2">
            <Send className="size-4"/> Send Broadcast
          </button>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <h3 className="font-display font-semibold">Sent ({rows.length})</h3>
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
          {rows.map(r => (
            <div key={r.id} className="glass rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary">{r.category}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div className="font-semibold text-sm">{r.title}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{r.body}</p>
              </div>
              <button onClick={() => del(r.id)} className="size-8 grid place-items-center rounded-lg hover:bg-rose-500/20">
                <Trash2 className="size-4 text-rose-400"/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
