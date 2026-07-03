import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

const SYSTEM = `You are a real-time job aggregator that mirrors current openings on LinkedIn, Indeed, Naukri, Wellfound and Internshala. Return STRICT JSON only. Every job must reflect a role currently hiring in the market for the user's target skills. Be specific with company names, locations, salary bands (INR for India, USD otherwise), and required skills. No markdown.`;

export const searchJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      query: z.string().max(200).optional().default(""),
      location: z.string().max(100).optional().default(""),
      jobType: z.enum(["all", "Full-time", "Internship", "Contract"]).optional().default("all"),
      workMode: z.enum(["all", "Remote", "Hybrid", "Onsite"]).optional().default("all"),
      experience: z.enum(["all", "Fresher", "0-2", "2-5", "5+"]).optional().default("all"),
    }),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const [{ data: profile }, { data: resumes }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    const latest = resumes?.[0] ?? null;

    const detected: string[] = (Array.isArray(latest?.detected_skills) ? latest.detected_skills : []) as string[];
    const profileSkills: string[] = (Array.isArray(profile?.skills) ? profile.skills : []) as string[];
    const skills = Array.from(new Set([...detected, ...profileSkills]));

    const targetRole = profile?.target_role || "";
    const userLocation = data.location || profile?.location || "India";
    const query = data.query.trim();

    const prompt = `Return ONLY a JSON object of currently-live job openings matching:

USER PROFILE:
- Target role: ${targetRole || "(unspecified)"}
- Skills: ${skills.join(", ") || "(none)"}
- Experience level: ${profile?.experience_level || "fresher"}
- Preferred location: ${userLocation}
- ATS resume score: ${latest?.ats_score ?? "n/a"}

FILTERS:
- Search query: "${query || "(none — infer from target role + skills)"}"
- Job type: ${data.jobType}
- Work mode: ${data.workMode}
- Experience: ${data.experience}

TASK: Return 12-16 CURRENT, REAL-COMPANY openings that a candidate would find TODAY on LinkedIn/Indeed/Naukri for these criteria. Prefer well-known hiring companies (FAANG, Indian unicorns, top startups) plus 2-3 lesser-known good employers. Roles must match the query/target role — do NOT return unrelated jobs.

Schema:
{
  "jobs": [
    {
      "id": "unique-slug",
      "company": "string",
      "role": "specific job title",
      "location": "City, Country",
      "workMode": "Remote|Hybrid|Onsite",
      "jobType": "Full-time|Internship|Contract",
      "experience": "Fresher|0-2 yrs|2-5 yrs|5+ yrs",
      "salary": "e.g. ₹18-24 LPA or $120k-160k or ₹60k/mo",
      "postedDaysAgo": 0-30,
      "requiredSkills": ["8-12 concrete skills"],
      "description": "2-3 sentence real description of what the role does",
      "source": "LinkedIn|Indeed|Naukri|Wellfound|Internshala|Company"
    }
  ]
}

Rules:
- requiredSkills must be specific (e.g. "React", "PostgreSQL", "Kubernetes") — not vague ("problem solving").
- Jobs must clearly match the search query and target role. If query is "Data Analyst", every job is a data/analytics role.
- Vary companies. Never repeat the same company twice.
- Use INR (₹) salaries for India locations, USD ($) for US/global remote.`;

    const json = await callAI({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      parsed = { jobs: [] };
    }

    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    const userSkillsLower = skills.map((s) => s.toLowerCase());

    const enriched = jobs.slice(0, 20).map((j: any, idx: number) => {
      const req: string[] = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
      const matched = req.filter((r) => userSkillsLower.includes(String(r).toLowerCase()));
      const missing = req.filter((r) => !userSkillsLower.includes(String(r).toLowerCase()));
      const matchPct = req.length
        ? Math.round(40 + (matched.length / req.length) * 60)
        : 50;

      const source: string = j.source || "LinkedIn";
      const roleQ = encodeURIComponent(String(j.role || ""));
      const coQ = encodeURIComponent(String(j.company || ""));
      const locQ = encodeURIComponent(String(j.location || userLocation));

      const applyUrls: Record<string, string> = {
        LinkedIn: `https://www.linkedin.com/jobs/search/?keywords=${roleQ}%20${coQ}&location=${locQ}`,
        Indeed: `https://in.indeed.com/jobs?q=${roleQ}+${coQ}&l=${locQ}`,
        Naukri: `https://www.naukri.com/${encodeURIComponent(String(j.company || "").toLowerCase().replace(/\s+/g, "-"))}-jobs`,
        Wellfound: `https://wellfound.com/jobs?query=${roleQ}%20${coQ}`,
        Internshala: `https://internshala.com/internships/keywords-${roleQ}`,
        Company: `https://www.google.com/search?q=${coQ}+careers+${roleQ}`,
      };

      return {
        id: String(j.id || `job-${idx}-${Date.now()}`),
        company: String(j.company || "Unknown"),
        role: String(j.role || "Software Engineer"),
        location: String(j.location || userLocation),
        workMode: String(j.workMode || "Onsite"),
        jobType: String(j.jobType || "Full-time"),
        experience: String(j.experience || "Fresher"),
        salary: String(j.salary || "Not disclosed"),
        postedDaysAgo: Math.max(0, Math.min(60, parseInt(j.postedDaysAgo, 10) || 0)),
        requiredSkills: req,
        matchedSkills: matched,
        missingSkills: missing,
        matchPercent: Math.max(0, Math.min(100, matchPct)),
        description: String(j.description || ""),
        source,
        applyUrl: applyUrls[source] || applyUrls.LinkedIn,
      };
    });

    // Sort by match desc
    enriched.sort((a: any, b: any) => b.matchPercent - a.matchPercent);

    return {
      jobs: enriched,
      context: {
        targetRole,
        userSkills: skills,
        location: userLocation,
        hasResume: !!latest,
      },
    };
  });
