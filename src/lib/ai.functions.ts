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

/* ---------------- QUIZ GENERATOR ---------------- */
export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    topic: z.string().min(1).max(80),
    difficulty: z.enum(["Easy", "Intermediate", "Hard"]),
    count: z.number().int().min(3).max(15),
  }))
  .handler(async ({ data }) => {
    const json = await callAI({
      messages: [
        {
          role: "system",
          content:
            "You generate high-quality placement-prep multiple-choice questions. Return ONLY valid JSON. Each question has 4 options and exactly one correct answer. No duplicates. Realistic interview-style difficulty.",
        },
        {
          role: "user",
          content: `Generate ${data.count} ${data.difficulty} MCQs on "${data.topic}".
Return JSON: { "questions": [ { "q": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..." } ] }
answer = index (0-3) of the correct option.`,
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
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
        answer: Math.max(0, Math.min(3, parseInt(q.answer, 10) || 0)),
        explanation: String(q.explanation ?? ""),
      }))
      .filter((q: any) => q.q && q.options.length === 4);
    return { questions };
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
