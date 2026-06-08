import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return startOfDay(d).toISOString().slice(0, 10);
}

export const getProgressOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, resumesRes, quizRes, activityRes] = await Promise.all([
      supabase.from("profiles").select("full_name, target_role, skills").eq("id", userId).maybeSingle(),
      supabase.from("resumes").select("ats_score, detected_skills, missing_skills, created_at, target_role").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("quiz_attempts").select("topic, percentage, score, total, weak_areas, strong_areas, created_at, difficulty").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("activity_logs").select("action, metadata, created_at").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);

    const profile = profileRes.data ?? null;
    const resumes = (resumesRes.data ?? []) as any[];
    const quizzes = (quizRes.data ?? []) as any[];
    const logs = (activityRes.data ?? []) as any[];

    // ---- Latest ATS + skill gap ----
    const latestResume = resumes.length ? resumes[resumes.length - 1] : null;
    const atsScore = latestResume?.ats_score ?? 0;
    const detectedSkills: string[] = (latestResume?.detected_skills as string[]) ?? (profile?.skills as string[]) ?? [];
    const missingSkills: string[] = (latestResume?.missing_skills as string[]) ?? [];
    const totalSkills = detectedSkills.length + missingSkills.length;
    const skillCompletion = totalSkills > 0 ? Math.round((detectedSkills.length / totalSkills) * 100) : 0;

    // ---- Quiz performance ----
    const quizAvg = quizzes.length
      ? Math.round(quizzes.reduce((s, q) => s + (q.percentage ?? 0), 0) / quizzes.length)
      : 0;

    // strong / weak topic frequency
    const topicScore: Record<string, { sum: number; n: number }> = {};
    for (const q of quizzes) {
      const t = q.topic ?? "General";
      topicScore[t] ||= { sum: 0, n: 0 };
      topicScore[t].sum += q.percentage ?? 0;
      topicScore[t].n += 1;
    }
    const topicAverages = Object.entries(topicScore).map(([topic, v]) => ({
      topic,
      avg: Math.round(v.sum / v.n),
      attempts: v.n,
    }));
    const strongTopics = [...topicAverages].sort((a, b) => b.avg - a.avg).slice(0, 4);
    const weakTopics = [...topicAverages].sort((a, b) => a.avg - b.avg).slice(0, 4);

    // improvement trend: first half avg vs second half avg
    let quizTrend = 0;
    if (quizzes.length >= 2) {
      const mid = Math.floor(quizzes.length / 2);
      const firstAvg = quizzes.slice(0, mid).reduce((s, q) => s + (q.percentage ?? 0), 0) / Math.max(mid, 1);
      const lastAvg = quizzes.slice(mid).reduce((s, q) => s + (q.percentage ?? 0), 0) / Math.max(quizzes.length - mid, 1);
      quizTrend = Math.round(lastAvg - firstAvg);
    }

    // ---- Roadmap + mock interview from activity_logs ----
    const roadmapDone = logs.filter((l) => l.action === "roadmap_task_completed").length;
    const roadmapTotal = Math.max(
      roadmapDone,
      Number((logs.find((l) => l.action === "roadmap_generated")?.metadata as any)?.total_tasks ?? 0),
      20,
    );
    const roadmapCompletion = Math.min(100, Math.round((roadmapDone / roadmapTotal) * 100));

    const interviewLogs = logs.filter((l) => l.action === "mock_interview_completed");
    const interviewScores = interviewLogs
      .map((l) => Number((l.metadata as any)?.score ?? 0))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const interviewAvg = interviewScores.length
      ? Math.round(interviewScores.reduce((s, n) => s + n, 0) / interviewScores.length)
      : 0;

    // ---- Placement readiness ----
    const readiness = Math.round(
      atsScore * 0.25 +
        skillCompletion * 0.25 +
        quizAvg * 0.2 +
        roadmapCompletion * 0.2 +
        interviewAvg * 0.1,
    );

    // ---- Weekly activity (last 7 days) ----
    const today = startOfDay(new Date());
    const days: { d: string; label: string; quizzes: number; roadmap: number; interviews: number; ats: number; hours: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = dayKey(date);
      days.push({
        d: key,
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        quizzes: 0,
        roadmap: 0,
        interviews: 0,
        ats: 0,
        hours: 0,
        total: 0,
      });
    }
    const dayIndex = new Map(days.map((d, i) => [d.d, i]));

    for (const q of quizzes) {
      const k = dayKey(new Date(q.created_at));
      const i = dayIndex.get(k);
      if (i !== undefined) days[i].quizzes += 1;
    }
    for (const r of resumes) {
      const k = dayKey(new Date(r.created_at));
      const i = dayIndex.get(k);
      if (i !== undefined) days[i].ats += 1;
    }
    for (const l of logs) {
      const k = dayKey(new Date(l.created_at));
      const i = dayIndex.get(k);
      if (i === undefined) continue;
      if (l.action === "roadmap_task_completed") days[i].roadmap += 1;
      if (l.action === "mock_interview_completed") days[i].interviews += 1;
    }
    for (const d of days) {
      // estimate study hours from events (~0.5h each)
      d.hours = Math.round((d.quizzes + d.roadmap + d.interviews + d.ats) * 0.5 * 10) / 10;
      d.total = d.quizzes + d.roadmap + d.interviews + d.ats;
    }

    // ---- Skill progress vs target role ----
    const skillProgress = detectedSkills.slice(0, 8).map((s) => ({ skill: s, value: 100 }));
    for (const m of missingSkills.slice(0, 8 - skillProgress.length)) {
      skillProgress.push({ skill: m, value: 20 });
    }

    // ---- ATS history trend ----
    const atsHistory = resumes.map((r, i) => ({
      w: `R${i + 1}`,
      v: r.ats_score ?? 0,
    }));

    // ---- Streak (consecutive days with any activity) ----
    const activeDays = new Set<string>();
    for (const q of quizzes) activeDays.add(dayKey(new Date(q.created_at)));
    for (const l of logs) activeDays.add(dayKey(new Date(l.created_at)));
    for (const r of resumes) activeDays.add(dayKey(new Date(r.created_at)));
    let streak = 0;
    const cursor = new Date(today);
    while (activeDays.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // ---- AI-style insights (rule-based, personalized) ----
    const insights: string[] = [];
    if (quizTrend > 0) insights.push(`Your quiz average improved by ${quizTrend}% recently — keep the streak going.`);
    else if (quizTrend < 0) insights.push(`Your quiz average dropped by ${Math.abs(quizTrend)}%. Revisit your last 3 weak topics.`);
    if (weakTopics[0]) insights.push(`${weakTopics[0].topic} remains your weakest topic (${weakTopics[0].avg}% avg).`);
    if (strongTopics[0] && strongTopics[0].avg >= 75) insights.push(`You're strong in ${strongTopics[0].topic} (${strongTopics[0].avg}% avg) — leverage it in interviews.`);
    if (missingSkills[0]) insights.push(`Add ${missingSkills.slice(0, 2).join(" & ")} to close the gap for ${profile?.target_role ?? "your target role"}.`);
    if (roadmapCompletion < 50) insights.push(`Complete more roadmap tasks to raise readiness — you're at ${roadmapCompletion}%.`);
    if (atsScore && atsScore < 75) insights.push(`Re-scan your resume — current ATS score is ${atsScore}.`);
    if (!quizzes.length) insights.push(`Take your first quiz to unlock personalized analytics.`);

    return {
      profile: { name: profile?.full_name ?? "", targetRole: profile?.target_role ?? "" },
      readiness,
      breakdown: {
        ats: atsScore,
        skillCompletion,
        quizAvg,
        roadmapCompletion,
        interviewAvg,
      },
      counts: {
        quizzes: quizzes.length,
        resumes: resumes.length,
        interviews: interviewLogs.length,
        roadmapDone,
        roadmapTotal,
      },
      weekly: days,
      atsHistory,
      topicAverages,
      strongTopics,
      weakTopics,
      quizTrend,
      skillProgress,
      detectedSkills,
      missingSkills,
      streak,
      insights,
    };
  });
