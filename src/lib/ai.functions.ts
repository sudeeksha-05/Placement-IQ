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
    throw new Error(`AI request failed: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/* ---------------- AI ASSISTANT ---------------- */
export const chatAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    messages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(4000),
    })).min(1).max(40),
  }))
  .handler(async ({ data }) => {
    const json = await callAI({
      messages: [
        {
          role: "system",
          content:
            "You are PlacementIQ — an elite AI career & placement coach for college students preparing for tech/product/consulting jobs. Give concrete, actionable, structured advice. Use short paragraphs and bullet lists. Reference real frameworks (STAR, CAR), and quantify suggestions. Be encouraging but honest.",
        },
        ...data.messages,
      ],
    });
    const reply = json?.choices?.[0]?.message?.content ?? "";
    return { reply };
  });

/* ---------------- PERSONALIZED ADAPTIVE QUIZ GENERATOR ---------------- */
export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    topic: z.string().min(1).max(80),
    difficulty: z.enum(["Easy", "Intermediate", "Hard"]).optional(),
    count: z.number().int().min(3).max(15),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Pull user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("full_name,target_role,skills,branch,experience_level")
      .eq("id", userId).maybeSingle();

    // Latest completed resume analysis
    const { data: resume } = await supabaseAdmin
      .from("resumes").select("target_role,ats_score,detected_skills,missing_skills,summary")
      .eq("user_id", userId).eq("status", "complete")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    // Last 10 quiz attempts
    const { data: history } = await supabaseAdmin
      .from("quiz_attempts")
      .select("topic,difficulty,percentage,weak_areas,strong_areas,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(10);

    // Adaptive difficulty: average over last 3 attempts on this topic (then any topic)
    let adaptive: "Easy" | "Intermediate" | "Hard" = data.difficulty ?? "Intermediate";
    const sameTopic = (history ?? []).filter(h => h.topic?.toLowerCase() === data.topic.toLowerCase()).slice(0, 3);
    const sample = sameTopic.length ? sameTopic : (history ?? []).slice(0, 3);
    if (sample.length >= 2) {
      const avg = sample.reduce((s, r) => s + (r.percentage ?? 0), 0) / sample.length;
      if (avg >= 80) adaptive = "Hard";
      else if (avg >= 55) adaptive = "Intermediate";
      else adaptive = "Easy";
    }

    const weakAreas = Array.from(new Set(
      (history ?? []).flatMap(h => (Array.isArray(h.weak_areas) ? (h.weak_areas as string[]) : []))
    )).slice(0, 10);

    const userCtx = {
      target_role: profile?.target_role ?? resume?.target_role ?? null,
      skills: profile?.skills ?? [],
      experience_level: profile?.experience_level ?? null,
      ats_score: resume?.ats_score ?? null,
      detected_skills: resume?.detected_skills ?? [],
      missing_skills: resume?.missing_skills ?? [],
      recent_weak_areas: weakAreas,
      recent_attempts: (history ?? []).slice(0, 5).map(h => ({
        topic: h.topic, difficulty: h.difficulty, percentage: h.percentage,
      })),
    };

    const json = await callAI({
      messages: [
        {
          role: "system",
          content:
            "You are PlacementIQ's adaptive quiz engine. Generate UNIQUE, personalized placement-prep questions tailored to the candidate's target role, skills, ATS gaps, and weak areas. Mix question types (MCQ, true/false, scenario-based, output-prediction, case-study) — but ALWAYS return exactly 4 plausible options with one correct answer. No two quizzes for the same user should be identical. Use realistic interview difficulty. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Generate ${data.count} questions on the topic "${data.topic}" at "${adaptive}" difficulty.

Personalize using this candidate context (JSON):
${JSON.stringify(userCtx)}

Distribution guidance:
- Weight ~40% toward the candidate's weak/missing skills relevant to "${data.topic}"
- ~30% core "${data.topic}" fundamentals
- ~20% applied/scenario questions tied to target_role
- ~10% advanced/edge cases

Each question must include a "subtopic" tag (short — e.g. "JavaScript closures", "SQL joins", "React hooks") used later for weakness analysis.

Return STRICT JSON:
{
  "questions": [
    {
      "q": "...",
      "type": "mcq" | "true_false" | "scenario" | "output" | "case",
      "subtopic": "...",
      "options": ["A","B","C","D"],
      "answer": 0,
      "explanation": "..."
    }
  ]
}
answer = index (0-3) of correct option.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { questions: [] }; }
    const questions = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .slice(0, data.count)
      .map((q: any) => ({
        q: String(q.q ?? ""),
        type: ["mcq","true_false","scenario","output","case"].includes(q.type) ? q.type : "mcq",
        subtopic: String(q.subtopic ?? data.topic),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
        answer: Math.max(0, Math.min(3, parseInt(q.answer, 10) || 0)),
        explanation: String(q.explanation ?? ""),
      }))
      .filter((q: any) => q.q && q.options.length === 4);

    return { questions, adaptive_difficulty: adaptive, personalized_for: userCtx.target_role };
  });

/* ---------------- QUIZ RESULT ANALYSIS + SAVE ---------------- */
export const saveQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    topic: z.string().min(1).max(80),
    difficulty: z.string().min(1).max(20),
    score: z.number().int().min(0),
    total: z.number().int().min(1),
    questionDetails: z.array(z.object({
      subtopic: z.string().max(120),
      correct: z.boolean(),
    })).max(50),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const percentage = Math.round((data.score / data.total) * 100);

    // Aggregate weak / strong subtopics
    const tally = new Map<string, { c: number; t: number }>();
    for (const q of data.questionDetails) {
      const v = tally.get(q.subtopic) ?? { c: 0, t: 0 };
      v.t += 1; if (q.correct) v.c += 1;
      tally.set(q.subtopic, v);
    }
    const weak_areas: string[] = [];
    const strong_areas: string[] = [];
    for (const [sub, v] of tally) {
      const rate = v.c / v.t;
      if (rate < 0.5) weak_areas.push(sub);
      else if (rate >= 0.8) strong_areas.push(sub);
    }

    // AI-generated recommendations
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("target_role,skills").eq("id", userId).maybeSingle();

    let recommendations: any = { summary: "", projects: [], roadmap: [], next_topics: [] };
    let recommended_topics: string[] = [];
    try {
      const aiJson = await callAI({
        messages: [
          { role: "system", content: "You give concise, actionable learning recommendations for a placement-prep student. Return ONLY valid JSON." },
          { role: "user", content: `Student target role: ${profile?.target_role ?? "Software Engineer"}.
Topic just attempted: ${data.topic} (${data.difficulty}). Scored ${percentage}%.
Weak subtopics: ${JSON.stringify(weak_areas)}.
Strong subtopics: ${JSON.stringify(strong_areas)}.

Return JSON:
{
  "summary": "<2 sentence verdict>",
  "next_topics": ["topic1","topic2","topic3"],
  "projects": ["project idea 1","project idea 2"],
  "roadmap": ["step 1","step 2","step 3"]
}` },
        ],
        response_format: { type: "json_object" },
      });
      const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
      const p = JSON.parse(raw);
      recommendations = {
        summary: String(p.summary ?? ""),
        projects: Array.isArray(p.projects) ? p.projects.slice(0, 5).map(String) : [],
        roadmap: Array.isArray(p.roadmap) ? p.roadmap.slice(0, 6).map(String) : [],
        next_topics: Array.isArray(p.next_topics) ? p.next_topics.slice(0, 5).map(String) : [],
      };
      recommended_topics = recommendations.next_topics;
    } catch { /* non-fatal */ }

    await supabaseAdmin.from("quiz_attempts").insert({
      user_id: userId,
      topic: data.topic,
      difficulty: data.difficulty,
      score: data.score,
      total: data.total,
      percentage,
      target_role: profile?.target_role ?? null,
      weak_areas,
      strong_areas,
      recommended_topics,
      recommendations,
      question_details: data.questionDetails,
    });

    return { percentage, weak_areas, strong_areas, recommendations };
  });


/* ---------------- MOCK INTERVIEW ---------------- */
export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    role: z.string().min(1).max(80),
    type: z.enum(["Technical", "HR", "Coding"]),
    history: z.array(z.object({
      question: z.string().max(2000),
      answer: z.string().max(4000),
    })).max(20),
    nextAnswer: z.string().max(4000).optional(),
  }))
  .handler(async ({ data }) => {
    const sys = `You are a senior interviewer conducting a ${data.type} round for a "${data.role}" role at a top tech company. Behavior:
- Ask ONE focused interview question at a time.
- After the candidate answers, evaluate it and ask the next progressively harder question.
- Be realistic, professional, and concise.
Return ONLY valid JSON: { "question": "<next question>", "feedback": { "score": 0-100, "strengths": "...", "improvements": "..." } | null }
- feedback is null for the very first question (no prior answer).`;

    const userMsg = data.history.length === 0 && !data.nextAnswer
      ? "Start the interview with the first question."
      : `Conversation so far (JSON):\n${JSON.stringify(data.history)}\nCandidate's latest answer: ${JSON.stringify(data.nextAnswer ?? "")}\nEvaluate it and ask the next question.`;

    const json = await callAI({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    return {
      question: String(parsed.question ?? ""),
      feedback: parsed.feedback ?? null,
    };
  });

/* ---------------- PERSONALIZED AI CAREER ROADMAP ---------------- */
export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    weeks: z.number().int().min(4).max(12).optional(),
  }).optional())
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const weeks = data?.weeks ?? 6;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name,target_role,skills,branch,graduation_year,experience_level,college")
      .eq("id", userId).maybeSingle();

    const { data: resume } = await supabaseAdmin
      .from("resumes")
      .select("target_role,ats_score,detected_skills,missing_skills,summary")
      .eq("user_id", userId).eq("status", "complete")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    const { data: attempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("topic,difficulty,percentage,weak_areas,strong_areas,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(15);

    const role = (profile?.target_role || resume?.target_role || "Software Engineer").trim();
    const skills: string[] = (profile?.skills as string[] | null) ?? [];
    const detected: string[] = (resume?.detected_skills as string[] | null) ?? [];
    const missing: string[] = (resume?.missing_skills as string[] | null) ?? [];
    const atsScore = resume?.ats_score ?? null;

    const quizAvg = (attempts ?? []).length
      ? Math.round((attempts ?? []).reduce((s, a) => s + (a.percentage ?? 0), 0) / (attempts ?? []).length)
      : null;
    const weakTopics = Array.from(new Set(
      (attempts ?? []).flatMap(a => (Array.isArray(a.weak_areas) ? (a.weak_areas as string[]) : []))
    )).slice(0, 10);
    const strongTopics = Array.from(new Set(
      (attempts ?? []).flatMap(a => (Array.isArray(a.strong_areas) ? (a.strong_areas as string[]) : []))
    )).slice(0, 10);

    // Readiness scoring
    const skillCompletion = (() => {
      const known = new Set([...skills, ...detected].map(s => s.toLowerCase()));
      const total = known.size + missing.length;
      return total ? Math.round((known.size / total) * 100) : 40;
    })();
    const atsReadiness = atsScore ?? 50;
    const interviewReadiness = quizAvg ?? 45;
    const careerReadiness = Math.round((skillCompletion + atsReadiness + interviewReadiness) / 3);

    const ctx = {
      name: profile?.full_name ?? null,
      target_role: role,
      branch: profile?.branch ?? null,
      graduation_year: profile?.graduation_year ?? null,
      experience_level: profile?.experience_level ?? null,
      current_skills: skills,
      resume_detected_skills: detected,
      missing_skills: missing,
      ats_score: atsScore,
      resume_summary: resume?.summary ?? null,
      quiz_avg_percent: quizAvg,
      weak_topics: weakTopics,
      strong_topics: strongTopics,
      recent_attempts: (attempts ?? []).slice(0, 6).map(a => ({
        topic: a.topic, percentage: a.percentage, difficulty: a.difficulty,
      })),
    };

    const json = await callAI({
      messages: [
        {
          role: "system",
          content:
            "You are PlacementIQ's Career Roadmap Architect. Generate a UNIQUE, deeply personalized week-by-week placement-prep roadmap tailored to the candidate's target role, current skills, ATS gaps, weaknesses, and quiz performance. Prioritize the candidate's MISSING SKILLS and WEAK TOPICS first. Recommend REAL, well-known learning resources with actual URLs (YouTube channels like freeCodeCamp/Fireship/Traversy, roadmap.sh, MDN, react.dev, spring.io, learn.microsoft.com, kaggle.com, leetcode.com, hackerrank.com, official docs). No two roadmaps for different candidates should look the same. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Generate a ${weeks}-week personalized roadmap for this candidate (JSON):
${JSON.stringify(ctx)}

REQUIREMENTS:
- Tailor every week's focus to "${role}" using the candidate's skill gaps and weak topics.
- Week 1-2 MUST aggressively cover missing/weak fundamentals.
- Mid weeks: applied projects + practice. Last weeks: interview sprint + system design + mock interviews.
- For each resource, include a real URL (https://...). Use trusted sources: roadmap.sh, MDN, react.dev, freecodecamp.org, youtube.com (real channels), leetcode.com, spring.io, learn.microsoft.com, kaggle.com, tableau.com, geeksforgeeks.org, official docs.
- Include role-appropriate project recommendations with brief descriptions.
- Be specific — reference the candidate's actual missing skills/weak topics by name in goals.

Return STRICT JSON:
{
  "headline": "<one motivating sentence personalized to candidate>",
  "summary": "<2-3 sentence analysis of where they stand and what this roadmap fixes>",
  "focus_areas": ["...","...","..."],
  "weeks": [
    {
      "week": 1,
      "title": "...",
      "learning_goals": ["...","..."],
      "topics": ["...","..."],
      "practice_tasks": ["...","..."],
      "projects": [{ "name": "...", "description": "..." }],
      "interview_prep": ["...","..."],
      "resources": [
        { "title": "...", "type": "youtube"|"docs"|"course"|"practice"|"certification"|"article", "url": "https://..." }
      ]
    }
  ],
  "recommended_projects": [
    { "name": "...", "description": "...", "skills": ["...","..."] }
  ],
  "certifications": [
    { "name": "...", "provider": "...", "url": "https://..." }
  ]
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const weeksOut = (Array.isArray(parsed.weeks) ? parsed.weeks : []).slice(0, weeks).map((w: any, i: number) => ({
      week: Number(w.week) || i + 1,
      title: String(w.title ?? `Week ${i + 1}`),
      learning_goals: (Array.isArray(w.learning_goals) ? w.learning_goals : []).map(String).slice(0, 6),
      topics: (Array.isArray(w.topics) ? w.topics : []).map(String).slice(0, 10),
      practice_tasks: (Array.isArray(w.practice_tasks) ? w.practice_tasks : []).map(String).slice(0, 6),
      projects: (Array.isArray(w.projects) ? w.projects : []).slice(0, 4).map((p: any) => ({
        name: String(p?.name ?? ""), description: String(p?.description ?? ""),
      })).filter((p: any) => p.name),
      interview_prep: (Array.isArray(w.interview_prep) ? w.interview_prep : []).map(String).slice(0, 6),
      resources: (Array.isArray(w.resources) ? w.resources : []).slice(0, 8).map((r: any) => ({
        title: String(r?.title ?? ""),
        type: ["youtube","docs","course","practice","certification","article"].includes(r?.type) ? r.type : "article",
        url: String(r?.url ?? ""),
      })).filter((r: any) => r.title && r.url.startsWith("http")),
    }));

    return {
      headline: String(parsed.headline ?? `Your ${role} roadmap`),
      summary: String(parsed.summary ?? ""),
      focus_areas: (Array.isArray(parsed.focus_areas) ? parsed.focus_areas : []).map(String).slice(0, 8),
      weeks: weeksOut,
      recommended_projects: (Array.isArray(parsed.recommended_projects) ? parsed.recommended_projects : [])
        .slice(0, 8).map((p: any) => ({
          name: String(p?.name ?? ""),
          description: String(p?.description ?? ""),
          skills: (Array.isArray(p?.skills) ? p.skills : []).map(String).slice(0, 8),
        })).filter((p: any) => p.name),
      certifications: (Array.isArray(parsed.certifications) ? parsed.certifications : [])
        .slice(0, 6).map((c: any) => ({
          name: String(c?.name ?? ""),
          provider: String(c?.provider ?? ""),
          url: String(c?.url ?? ""),
        })).filter((c: any) => c.name),
      readiness: {
        career: careerReadiness,
        skill_completion: skillCompletion,
        ats: atsReadiness,
        interview: interviewReadiness,
      },
      context: {
        target_role: role,
        ats_score: atsScore,
        quiz_avg: quizAvg,
        missing_skills: missing,
        weak_topics: weakTopics,
        strong_topics: strongTopics,
      },
    };
  });

/* ---------------- AI LIVE INTERVIEW (voice-based) ---------------- */
const LIVE_TYPES = ["Technical","HR","Coding","System Design","Behavioral","Project Discussion","Managerial","Final HR","Mixed"] as const;
const LIVE_DIFF = ["Beginner","Intermediate","Advanced","FAANG"] as const;

export const liveInterviewNext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    role: z.string().min(1).max(80),
    type: z.enum(LIVE_TYPES),
    difficulty: z.enum(LIVE_DIFF),
    company: z.string().max(60).optional(),
    language: z.string().max(30).optional(),
    turnsRemaining: z.number().int().min(0).max(30),
    history: z.array(z.object({
      speaker: z.enum(["interviewer","candidate"]),
      text: z.string().max(4000),
    })).max(60),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const [{ data: profile }, { data: resume }] = await Promise.all([
      supabaseAdmin.from("profiles")
        .select("full_name,target_role,skills,branch,graduation_year,experience_level,college,bio")
        .eq("id", userId).maybeSingle(),
      supabaseAdmin.from("resumes")
        .select("target_role,ats_score,detected_skills,missing_skills,summary,parsed_data")
        .eq("user_id", userId).eq("status", "complete")
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const parsed = (resume?.parsed_data ?? {}) as any;
    const candidate = {
      name: profile?.full_name ?? "Candidate",
      target_role: data.role,
      branch: profile?.branch ?? null,
      experience_level: profile?.experience_level ?? null,
      skills: profile?.skills ?? [],
      resume_skills: resume?.detected_skills ?? [],
      missing_skills: resume?.missing_skills ?? [],
      projects: parsed?.projects ?? parsed?.Projects ?? [],
      experience: parsed?.experience ?? parsed?.Experience ?? [],
      education: parsed?.education ?? parsed?.Education ?? profile?.college ?? null,
      certifications: parsed?.certifications ?? [],
      resume_summary: resume?.summary ?? null,
      ats_score: resume?.ats_score ?? null,
    };

    const isFirst = data.history.length === 0;
    const isLast = data.turnsRemaining <= 1;

    const sys = `You are an AI voice interviewer conducting a ${data.difficulty}-level ${data.type} interview${data.company ? ` in the style of ${data.company}` : ""} for a "${data.role}" role. You are speaking OUT LOUD — write natural conversational speech, not text. Rules:
- Speak like a real recruiter/engineer: warm, professional, concise (1-3 sentences).
- Ask ONE question or follow-up at a time. NO bullet lists, NO markdown, NO enumerations.
- Use the candidate's actual resume, projects, and skills. Reference them by name.
- ${data.type === "Coding" ? "Describe coding problems verbally. Ask about approach, complexity, edge cases. Do not dictate code." : ""}
- ${data.type === "Project Discussion" ? "Drill deep into the candidate's actual listed projects." : ""}
- ${data.type === "HR" || data.type === "Behavioral" || data.type === "Managerial" || data.type === "Final HR" ? "Focus on behavior, motivation, teamwork, leadership. Use situational prompts." : ""}
- Ask follow-ups based on what the candidate just said. If they mentioned a tool/decision, probe why.
- ${data.language && data.language !== "English" ? `Respond in ${data.language}.` : "Respond in English."}
Return ONLY valid JSON: { "say": "<what to speak next>", "phase": "greeting"|"question"|"followup"|"closing" }`;

    let userMsg: string;
    if (isFirst) {
      userMsg = `Begin the interview. Greet ${candidate.name} warmly, briefly introduce yourself as the ${data.type} interviewer${data.company ? ` from ${data.company}` : ""}, briefly outline what this ${data.type} round will cover, then ask your first question. Keep the whole utterance under 60 words.\n\nCANDIDATE CONTEXT (JSON):\n${JSON.stringify(candidate)}`;
    } else if (isLast) {
      userMsg = `This is your final turn. Thank the candidate, mention 1 specific thing they discussed, and close the interview politely. No new questions.\n\nCANDIDATE CONTEXT:\n${JSON.stringify(candidate)}\n\nTRANSCRIPT SO FAR:\n${JSON.stringify(data.history)}`;
    } else {
      userMsg = `Continue the interview. Acknowledge briefly (optional, 1 short phrase), then either ask a natural follow-up to what the candidate just said, OR move to the next question. Keep to 1-2 sentences.\n\nCANDIDATE CONTEXT:\n${JSON.stringify(candidate)}\n\nTRANSCRIPT SO FAR:\n${JSON.stringify(data.history)}`;
    }

    const json = await callAI({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let out: any; try { out = JSON.parse(raw); } catch { out = {}; }
    const say = String(out.say ?? "").trim() || "Thank you.";
    const phase = ["greeting","question","followup","closing"].includes(out.phase) ? out.phase : (isFirst ? "greeting" : isLast ? "closing" : "question");
    return { say, phase, done: isLast };
  });

export const liveInterviewReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    role: z.string().min(1).max(80),
    type: z.enum(LIVE_TYPES),
    difficulty: z.enum(LIVE_DIFF),
    company: z.string().max(60).optional(),
    durationSec: z.number().int().min(0),
    transcript: z.array(z.object({
      speaker: z.enum(["interviewer","candidate"]),
      text: z.string().max(4000),
    })).min(1).max(80),
  }))
  .handler(async ({ data }) => {
    const sys = `You are a senior interview evaluator. Analyze the FULL transcript and produce a strict, honest, actionable report. Return ONLY valid JSON matching the schema exactly.`;
    const userMsg = `Round: ${data.type} | Role: ${data.role} | Difficulty: ${data.difficulty}${data.company ? ` | Company style: ${data.company}` : ""} | Duration: ${Math.round(data.durationSec/60)} min

TRANSCRIPT (JSON):
${JSON.stringify(data.transcript)}

Return JSON:
{
  "scores": {
    "overall": 0-100,
    "technical": 0-100,
    "communication": 0-100,
    "confidence": 0-100,
    "hr": 0-100,
    "problem_solving": 0-100,
    "project_knowledge": 0-100,
    "voice_clarity": 0-100,
    "professionalism": 0-100
  },
  "verdict": "<2 sentence summary>",
  "strengths": ["...","...","..."],
  "weaknesses": ["...","...","..."],
  "missed_concepts": ["..."],
  "incorrect_answers": [{ "question": "...", "issue": "..." }],
  "suggested_improvements": ["..."],
  "learning_resources": [{ "title": "...", "url": "https://...", "type": "youtube|docs|course|practice" }],
  "recommended_projects": ["..."],
  "suggested_certifications": [{ "name": "...", "provider": "...", "url": "https://..." }],
  "topics_to_revise": ["..."],
  "speech_analysis": {
    "pace": "slow|good|fast",
    "filler_words": ["um","like"],
    "tone": "...",
    "energy": "low|medium|high",
    "tips": ["..."]
  },
  "readiness_percent": 0-100
}
Use REAL URLs (roadmap.sh, MDN, freecodecamp.org, leetcode.com, coursera.org, learn.microsoft.com, official docs).`;

    const json = await callAI({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
    });
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let p: any; try { p = JSON.parse(raw); } catch { p = {}; }

    const clamp = (n: any) => Math.max(0, Math.min(100, parseInt(n, 10) || 0));
    const s = p.scores ?? {};
    return {
      scores: {
        overall: clamp(s.overall),
        technical: clamp(s.technical),
        communication: clamp(s.communication),
        confidence: clamp(s.confidence),
        hr: clamp(s.hr),
        problem_solving: clamp(s.problem_solving),
        project_knowledge: clamp(s.project_knowledge),
        voice_clarity: clamp(s.voice_clarity),
        professionalism: clamp(s.professionalism),
      },
      verdict: String(p.verdict ?? ""),
      strengths: (Array.isArray(p.strengths) ? p.strengths : []).map(String).slice(0, 6),
      weaknesses: (Array.isArray(p.weaknesses) ? p.weaknesses : []).map(String).slice(0, 6),
      missed_concepts: (Array.isArray(p.missed_concepts) ? p.missed_concepts : []).map(String).slice(0, 8),
      incorrect_answers: (Array.isArray(p.incorrect_answers) ? p.incorrect_answers : []).slice(0, 6).map((x: any) => ({
        question: String(x?.question ?? ""), issue: String(x?.issue ?? ""),
      })).filter((x: any) => x.question),
      suggested_improvements: (Array.isArray(p.suggested_improvements) ? p.suggested_improvements : []).map(String).slice(0, 8),
      learning_resources: (Array.isArray(p.learning_resources) ? p.learning_resources : []).slice(0, 8).map((r: any) => ({
        title: String(r?.title ?? ""), url: String(r?.url ?? ""), type: String(r?.type ?? "article"),
      })).filter((r: any) => r.title && r.url.startsWith("http")),
      recommended_projects: (Array.isArray(p.recommended_projects) ? p.recommended_projects : []).map(String).slice(0, 6),
      suggested_certifications: (Array.isArray(p.suggested_certifications) ? p.suggested_certifications : []).slice(0, 6).map((c: any) => ({
        name: String(c?.name ?? ""), provider: String(c?.provider ?? ""), url: String(c?.url ?? ""),
      })).filter((c: any) => c.name),
      topics_to_revise: (Array.isArray(p.topics_to_revise) ? p.topics_to_revise : []).map(String).slice(0, 10),
      speech_analysis: {
        pace: ["slow","good","fast"].includes(p?.speech_analysis?.pace) ? p.speech_analysis.pace : "good",
        filler_words: (Array.isArray(p?.speech_analysis?.filler_words) ? p.speech_analysis.filler_words : []).map(String).slice(0, 8),
        tone: String(p?.speech_analysis?.tone ?? ""),
        energy: ["low","medium","high"].includes(p?.speech_analysis?.energy) ? p.speech_analysis.energy : "medium",
        tips: (Array.isArray(p?.speech_analysis?.tips) ? p.speech_analysis.tips : []).map(String).slice(0, 6),
      },
      readiness_percent: clamp(p.readiness_percent),
    };
  });
