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
