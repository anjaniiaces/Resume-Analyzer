import { Router, type IRouter } from "express";
import { db, analysisResultsTable, jobProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function parseResult(row: typeof analysisResultsTable.$inferSelect) {
  return {
    ...row,
    matchingSkills: JSON.parse(row.matchingSkills || "[]") as string[],
    skillsGap: JSON.parse(row.skillsGap || "[]") as string[],
  };
}

router.get("/reports/:refNo", async (req, res) => {
  try {
    const { refNo } = req.params;

    const [jobProfile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.refNo, refNo));
    const results = await db.select().from(analysisResultsTable).where(eq(analysisResultsTable.refNo, refNo)).orderBy(analysisResultsTable.atsScore);

    const parsed = results.map(parseResult).sort((a, b) => b.atsScore - a.atsScore);

    res.json({
      refNo,
      jobTitle: jobProfile?.title ?? refNo,
      generatedAt: new Date().toISOString(),
      totalCandidates: parsed.length,
      candidates: parsed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/reports/:refNo/export", async (req, res) => {
  try {
    const { refNo } = req.params;

    const [jobProfile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.refNo, refNo));
    const results = await db.select().from(analysisResultsTable).where(eq(analysisResultsTable.refNo, refNo));

    const parsed = results.map(parseResult).sort((a, b) => b.atsScore - a.atsScore);

    const headers = [
      "Ref No",
      "Job Title",
      "Candidate Name",
      "Email",
      "Phone",
      "Address",
      "ATS Score",
      "Suitability",
      "Matching Skills",
      "Skills Gap",
      "Years Experience",
      "Experience Summary",
      "Profile Summary",
      "Recommendation",
      "Analyzed At",
    ];

    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

    const rows = parsed.map(r => [
      escape(refNo),
      escape(jobProfile?.title ?? refNo),
      escape(r.candidateName),
      escape(r.candidateEmail),
      escape(r.candidatePhone),
      escape(r.candidateAddress),
      r.atsScore.toFixed(1),
      escape(r.suitability),
      escape(r.matchingSkills.join("; ")),
      escape(r.skillsGap.join("; ")),
      r.yearsExperience.toFixed(1),
      escape(r.experienceSummary),
      escape(r.profileSummary),
      escape(r.recommendation),
      escape(new Date(r.analyzedAt).toISOString()),
    ].join(","));

    const csv = [headers.map(escape).join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="ats-report-${refNo}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export report" });
  }
});

export default router;
