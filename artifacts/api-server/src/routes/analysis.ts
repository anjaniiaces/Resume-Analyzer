import { Router, type IRouter } from "express";
import {
  db,
  resumesTable,
  analysisResultsTable,
  jobProfilesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

async function runAnalysis(resumeId: number) {
  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, resumeId));
  if (!resume) throw new Error("Resume not found");

  const [jobProfile] = await db
    .select()
    .from(jobProfilesTable)
    .where(eq(jobProfilesTable.refNo, resume.refNo));
  if (!jobProfile)
    throw new Error("Job profile not found for refNo: " + resume.refNo);

  const requiredSkills: string[] = JSON.parse(
    jobProfile.requiredSkills || "[]",
  );
  const preferredSkills: string[] = JSON.parse(
    jobProfile.preferredSkills || "[]",
  );

  const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze the following resume against the job description and return a JSON response.

JOB REFERENCE: ${jobProfile.refNo}
JOB TITLE: ${jobProfile.title}
DEPARTMENT: ${jobProfile.department}
JOB DESCRIPTION: ${jobProfile.description}
REQUIRED SKILLS: ${requiredSkills.join(", ")}
PREFERRED SKILLS: ${preferredSkills.join(", ")}
MINIMUM EXPERIENCE: ${jobProfile.minExperienceYears} years

RESUME FILE: ${resume.fileName}
RESUME CONTENT:
${resume.originalText.substring(0, 8000)}

Please analyze and return ONLY valid JSON with this exact structure:
{
  "candidateName": "Full name extracted from resume",
  "candidateEmail": "Email address extracted",
  "candidatePhone": "Phone number extracted",
  "candidateAddress": "Address extracted (city, country at minimum)",
  "profileSummary": "2-3 sentence professional summary of the candidate",
  "atsScore": 75.5,
  "suitability": "Highly Suitable|Suitable|Partially Suitable|Not Suitable",
  "matchingSkills": ["skill1", "skill2"],
  "skillsGap": ["missing skill1", "missing skill2"],
  "experienceSummary": "Brief description of relevant experience",
  "yearsExperience": 5.0,
  "recommendation": "Clear hiring recommendation with reasoning (2-3 sentences)"
}

ATS Score rules:
- Score from 0-100 based on keyword match, skills match, experience match, and overall fit
- Required skills match counts more than preferred skills
- Experience level affects score significantly

Suitability:
- Highly Suitable: 75-100
- Suitable: 55-74  
- Partially Suitable: 35-54
- Not Suitable: 0-34

Be precise and only return valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let parsed: {
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    candidateAddress?: string;
    profileSummary?: string;
    atsScore?: number;
    suitability?: string;
    matchingSkills?: string[];
    skillsGap?: string[];
    experienceSummary?: string;
    yearsExperience?: number;
    recommendation?: string;
  };

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    parsed = {};
  }

  const [existing] = await db
    .select()
    .from(analysisResultsTable)
    .where(eq(analysisResultsTable.resumeId, resumeId));

  const data = {
    resumeId,
    refNo: resume.refNo,
    candidateName: parsed.candidateName || "Unknown",
    candidateEmail: parsed.candidateEmail || "",
    candidatePhone: parsed.candidatePhone || "",
    candidateAddress: parsed.candidateAddress || "",
    profileSummary: parsed.profileSummary || "",
    atsScore: parsed.atsScore ?? 0,
    suitability: parsed.suitability || "Not Suitable",
    matchingSkills: JSON.stringify(parsed.matchingSkills || []),
    skillsGap: JSON.stringify(parsed.skillsGap || []),
    experienceSummary: parsed.experienceSummary || "",
    yearsExperience: parsed.yearsExperience ?? 0,
    recommendation: parsed.recommendation || "",
  };

  let result;
  if (existing) {
    const [updated] = await db
      .update(analysisResultsTable)
      .set({ ...data, analyzedAt: new Date() })
      .where(eq(analysisResultsTable.resumeId, resumeId))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(analysisResultsTable)
      .values(data)
      .returning();
    result = created;
  }

  await db
    .update(resumesTable)
    .set({
      candidateName: parsed.candidateName || "",
      candidateEmail: parsed.candidateEmail || "",
      candidatePhone: parsed.candidatePhone || "",
      candidateAddress: parsed.candidateAddress || "",
      analysisId: result.id,
    })
    .where(eq(resumesTable.id, resumeId));

  return {
    ...result,
    matchingSkills: JSON.parse(result.matchingSkills || "[]") as string[],
    skillsGap: JSON.parse(result.skillsGap || "[]") as string[],
  };
}

router.post("/analysis/:resumeId", async (req, res) => {
  try {
    const resumeId = parseInt(req.params.resumeId);
    const result = await runAnalysis(resumeId);
    res.json(result);
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    res.status(500).json({ error: message });
  }
});

router.post("/analysis/batch", async (req, res) => {
  try {
    const { refNo } = req.body as { refNo: string };
    if (!refNo) return res.status(400).json({ error: "refNo is required" });

    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.refNo, refNo));

    const results = [];
    for (const resume of resumes) {
      try {
        const result = await runAnalysis(resume.id);
        results.push(result);
      } catch (err) {
        console.error(`Failed to analyze resume ${resume.id}:`, err);
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Batch analysis failed" });
  }
});

export default router;
