import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Brain, MessageSquareCode, Map } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/content")({
  component: ContentAdmin,
});

type Tab = "quizzes" | "interview" | "roadmaps";

function ContentAdmin() {
  const [tab, setTab] = useState<Tab>("quizzes");
  return (
    <AdminShell title="Content Management" subtitle="Quizzes, interview questions and career roadmaps">
      <div className="flex gap-2 mb-4">
        <TabBtn active={tab === "quizzes"} onClick={() => setTab("quizzes")} icon={<Brain className="size-4"/>}>Quizzes</TabBtn>
        <TabBtn active={tab === "interview"} onClick={() => setTab("interview")} icon={<MessageSquareCode className="size-4"/>}>Interview Qs</TabBtn>
        <TabBtn active={tab === "roadmaps"} onClick={() => setTab("roadmaps")} icon={<Map className="size-4"/>}>Roadmaps</TabBtn>
      </div>
      {tab === "quizzes" && <Quizzes/>}
      {tab === "interview" && <Interviews/>}
      {tab === "roadmaps" && <Roadmaps/>}
    </AdminShell>
  );
}

function TabBtn({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
      active ? "bg-gradient-to-r from-primary to-accent text-white glow" : "glass hover:bg-white/10"
    }`}>{icon}{children}</button>
  );
}

function Quizzes() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", topic: "", difficulty: "medium" });

  const load = async () => {
    const { data } = await supabase.from("admin_quizzes" as any).select("*").order("created_at", { ascending: false });
    setRows((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title || !form.topic) return toast.error("Title and topic required");
    const { error } = await supabase.from("admin_quizzes" as any).insert(form);
    if (error) toast.error(error.message); else { toast.success("Quiz added"); setForm({ title: "", topic: "", difficulty: "medium" }); load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("admin_quizzes" as any).delete().eq("id", id); load();
  };

  return (
    <div className="space-y-4">
      <div className="glass neon-border rounded-2xl p-4 grid md:grid-cols-4 gap-3">
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm md:col-span-2"/>
        <input placeholder="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm"/>
        <div className="flex gap-2">
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm bg-card flex-1">
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <button onClick={add} className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm flex items-center gap-1 glow"><Plus className="size-4"/></button>
        </div>
      </div>
      <ItemList rows={rows} render={r => <><b>{r.title}</b> · {r.topic} · <i>{r.difficulty}</i></>} onDelete={del}/>
    </div>
  );
}

function Interviews() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ role: "", category: "behavioral", question: "", difficulty: "medium" });
  const load = async () => {
    const { data } = await supabase.from("interview_questions" as any).select("*").order("created_at", { ascending: false });
    setRows((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.role || !form.question) return toast.error("Role and question required");
    const { error } = await supabase.from("interview_questions" as any).insert(form);
    if (error) toast.error(error.message); else { toast.success("Added"); setForm({ role: "", category: "behavioral", question: "", difficulty: "medium" }); load(); }
  };
  const del = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("interview_questions" as any).delete().eq("id", id); load(); };

  return (
    <div className="space-y-4">
      <div className="glass neon-border rounded-2xl p-4 grid md:grid-cols-4 gap-3">
        <input placeholder="Target role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm"/>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm bg-card">
          <option>behavioral</option><option>technical</option><option>system-design</option><option>hr</option>
        </select>
        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm bg-card">
          <option>easy</option><option>medium</option><option>hard</option>
        </select>
        <button onClick={add} className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm flex items-center justify-center gap-1 glow"><Plus className="size-4"/> Add</button>
        <textarea placeholder="Question" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm md:col-span-4" rows={2}/>
      </div>
      <ItemList rows={rows} render={r => <><b>{r.role}</b> · {r.category} · {r.question}</>} onDelete={del}/>
    </div>
  );
}

function Roadmaps() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ role: "", title: "", description: "" });
  const load = async () => {
    const { data } = await supabase.from("career_roadmaps" as any).select("*").order("created_at", { ascending: false });
    setRows((data as any[]) || []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.role || !form.title) return toast.error("Role and title required");
    const { error } = await supabase.from("career_roadmaps" as any).insert(form);
    if (error) toast.error(error.message); else { toast.success("Added"); setForm({ role: "", title: "", description: "" }); load(); }
  };
  const del = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("career_roadmaps" as any).delete().eq("id", id); load(); };

  return (
    <div className="space-y-4">
      <div className="glass neon-border rounded-2xl p-4 grid md:grid-cols-3 gap-3">
        <input placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm"/>
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm"/>
        <button onClick={add} className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm flex items-center justify-center gap-1 glow"><Plus className="size-4"/> Add Roadmap</button>
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass rounded-lg px-3 py-2 text-sm md:col-span-3" rows={2}/>
      </div>
      <ItemList rows={rows} render={r => <><b>{r.title}</b> · {r.role}<div className="text-xs text-muted-foreground">{r.description}</div></>} onDelete={del}/>
    </div>
  );
}

function ItemList({ rows, render, onDelete }: { rows: any[]; render: (r: any) => React.ReactNode; onDelete: (id: string) => void }) {
  return (
    <div className="glass neon-border rounded-2xl divide-y divide-border/40">
      {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No items yet</div>}
      {rows.map(r => (
        <div key={r.id} className="p-4 flex items-start justify-between gap-3">
          <div className="text-sm flex-1 min-w-0">{render(r)}</div>
          <button onClick={() => onDelete(r.id)} className="size-8 grid place-items-center rounded-lg hover:bg-rose-500/20"><Trash2 className="size-4 text-rose-400"/></button>
        </div>
      ))}
    </div>
  );
}
