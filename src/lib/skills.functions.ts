import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", ...body }),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limit hit, please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable Cloud.");
    throw new Error(`AI failed: ${t.slice(0, 200)}`);
  }
  return res.json();
}

const SYSTEM = `You are a senior career coach and technical recruiter. You produce STRICT JSON only. No markdown, no commentary. Every value must be personalized to the input.`;

export const analyzeSkillGap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    targetRole: z.string().min(2).max(80),
  }))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Pull latest resume + profile
    const [{ data: profile }, { data: resumes }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("resumes").select("*").eq("user_id", userId).eq("status", "complete")
        .order("created_at", { ascending: false }).limit(1),
    ]);
    const latest = resumes?.[0] ?? null;

    const detected: string[] = (Array.isArray(latest?.detected_skills) ? latest.detected_skills : []) as string[];
    const profileSkills: string[] = (Array.isArray(profile?.skills) ? profile.skills : []) as string[];
    const allUserSkills = Array.from(new Set([...detected, ...profileSkills]));


    const prompt = `Perform a rigorous skill gap analysis for a candidate targeting the role of "${data.targetRole}".

CANDIDATE PROFILE:
- Target role: ${data.targetRole}
- Current declared skills: ${profileSkills.join(", ") || "none"}
- Skills detected from latest resume: ${detected.join(", ") || "no resume analyzed yet"}
- Latest ATS score: ${latest?.ats_score ?? "n/a"}
- Experience level: ${profile?.experience_level ?? "fresher"}
- Branch: ${profile?.branch ?? "n/a"}

TASK: Return ONLY a JSON object with EXACTLY this schema:
{
  "required_skills": [                              // 8-14 industry-standard skills for THIS role in 2025
    { "name": "string", "importance": 1-5, "user_level": 0-100, "target_level": 60-100, "category": "language|framework|database|cloud|devops|tool|concept" }
  ],
  "matched_skills": ["..."],                        // skills user already has
  "missing_skills": ["..."],                        // required skills user lacks
  "match_percent": 0-100,                           // overall match %
  "readiness_score": 0-100,                         // job readiness
  "weeks_to_ready": 1-52,                           // realistic weeks with 8h/week
  "strengths": ["short bullet", ...],               // 2-4 items
  "weaknesses": ["short bullet", ...],              // 2-4 items
  "ai_summary": "2-3 sentences, personalized, mentions specific skills",
  "projects": [                                     // 4-6 projects that CLOSE the gaps
    { "title": "string", "description": "1 sentence", "skills": ["..."], "difficulty": "Beginner|Intermediate|Advanced", "weeks": 1-8, "github_query": "search query for github" }
  ],
  "certifications": [                               // 4-6 relevant certs
    { "name": "string", "provider": "string", "duration": "e.g. 4 weeks", "difficulty": "Beginner|Intermediate|Advanced", "cost": "Free|Paid", "url": "official cert URL" }
  ]
}

Rules:
- user_level = honest estimate 0-100 based on whether skill appears in user's skills. Skills NOT in user's list => user_level 0-15. Skills in user's list => 55-85.
- Only include skills TRULY relevant to "${data.targetRole}". No React for a Data Scientist. No Tableau for a Backend Engineer.
- URLs must be real (coursera.org, aws.amazon.com/certification, learn.microsoft.com, cloud.google.com, meta certificate on coursera, etc.).`;

    const json = await callAI({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { parsed = {}; }

    // Sanitize
    const required_skills = Array.isArray(parsed.required_skills) ? parsed.required_skills.slice(0, 16) : [];
    const matched_skills = Array.isArray(parsed.matched_skills) ? parsed.matched_skills : [];
    const missing_skills = Array.isArray(parsed.missing_skills) ? parsed.missing_skills : [];
    const projects = Array.isArray(parsed.projects) ? parsed.projects.slice(0, 8) : [];
    const certifications = Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 8) : [];

    return {
      required_skills,
      matched_skills,
      missing_skills,
      match_percent: Math.max(0, Math.min(100, parseInt(parsed.match_percent, 10) || 0)),
      readiness_score: Math.max(0, Math.min(100, parseInt(parsed.readiness_score, 10) || 0)),
      weeks_to_ready: Math.max(1, Math.min(52, parseInt(parsed.weeks_to_ready, 10) || 6)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 6) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 6) : [],
      ai_summary: typeof parsed.ai_summary === "string" ? parsed.ai_summary : "",
      projects,
      certifications,
      context: {
        target_role: data.targetRole,
        ats_score: latest?.ats_score ?? null,
        user_skills: allUserSkills,
        has_resume: !!latest,
      },
    };
  });
