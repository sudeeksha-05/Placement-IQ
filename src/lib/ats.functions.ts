import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM = `You are an expert ATS (Applicant Tracking System) resume analyzer for fresh-graduate placement roles. Score resumes strictly like a top-tier company's ATS would. Return ONLY valid JSON matching the requested schema. Be specific and actionable.`;

function buildPrompt(targetRole: string) {
  return `Analyze the attached resume PDF for the role of "${targetRole}".

Return a JSON object with EXACTLY this shape (no markdown, no commentary):
{
  "ats_score": <integer 0-100>,
  "summary": "<2-sentence verdict>",
  "detected_skills": ["skill1", "skill2", ...],     // skills clearly found in the resume (max 15)
  "missing_skills": ["skill1", "skill2", ...],      // important skills missing for this role (max 8)
  "suggestions": [
    { "ok": true|false, "text": "<specific actionable feedback>" },
    ...                                              // 5-8 items, mix of strengths (ok:true) and improvements (ok:false)
  ]
}`;
}

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    resumeId: z.string().uuid(),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch the resume row (must belong to user)
    const { data: resume, error: rErr } = await supabaseAdmin
      .from("resumes").select("*").eq("id", data.resumeId).eq("user_id", userId).single();
    if (rErr || !resume) throw new Error("Resume not found");

    // Download the file bytes
    const { data: fileBlob, error: dlErr } = await supabaseAdmin
      .storage.from("resumes").download(resume.file_path);
    if (dlErr || !fileBlob) throw new Error("Failed to read resume file");

    const buf = Buffer.from(await fileBlob.arrayBuffer());
    const base64 = buf.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    // Call Lovable AI Gateway with PDF input + JSON response
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt(resume.target_role) },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      await supabaseAdmin.from("resumes").update({ status: "failed" }).eq("id", resume.id);
      if (aiRes.status === 429) throw new Error("Rate limit hit, please retry shortly.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable Cloud.");
      throw new Error(`AI request failed: ${errTxt.slice(0, 200)}`);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; }
    catch { parsed = {}; }

    const ats_score = Math.max(0, Math.min(100, parseInt(parsed.ats_score ?? 0, 10) || 0));
    const detected_skills = Array.isArray(parsed.detected_skills) ? parsed.detected_skills.slice(0, 20) : [];
    const missing_skills = Array.isArray(parsed.missing_skills) ? parsed.missing_skills.slice(0, 10) : [];
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 10) : [];
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    const { error: upErr } = await supabaseAdmin.from("resumes").update({
      ats_score, detected_skills, missing_skills, suggestions, summary, status: "complete",
    }).eq("id", resume.id);
    if (upErr) throw new Error(upErr.message);

    return { ats_score, detected_skills, missing_skills, suggestions, summary };
  });
