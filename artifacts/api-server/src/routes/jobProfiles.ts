import { Router, type IRouter } from "express";
import { db, jobProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateJobProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

function parseProfile(row: typeof jobProfilesTable.$inferSelect) {
  return {
    ...row,
    requiredSkills: JSON.parse(row.requiredSkills || "[]") as string[],
    preferredSkills: JSON.parse(row.preferredSkills || "[]") as string[],
  };
}

router.get("/job-profiles", async (_req, res) => {
  try {
    const profiles = await db.select().from(jobProfilesTable).orderBy(jobProfilesTable.refNo);
    res.json(profiles.map(parseProfile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list job profiles" });
  }
});

router.post("/job-profiles", async (req, res) => {
  try {
    const body = CreateJobProfileBody.parse(req.body);
    const [created] = await db.insert(jobProfilesTable).values({
      refNo: body.refNo,
      title: body.title,
      department: body.department ?? "",
      description: body.description,
      requiredSkills: JSON.stringify(body.requiredSkills),
      preferredSkills: JSON.stringify(body.preferredSkills),
      minExperienceYears: body.minExperienceYears,
    }).returning();
    res.status(201).json(parseProfile(created));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create job profile" });
  }
});

router.get("/job-profiles/:refNo", async (req, res) => {
  try {
    const [profile] = await db.select().from(jobProfilesTable).where(eq(jobProfilesTable.refNo, req.params.refNo));
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(parseProfile(profile));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get job profile" });
  }
});

router.put("/job-profiles/:refNo", async (req, res) => {
  try {
    const body = CreateJobProfileBody.parse(req.body);
    const [updated] = await db.update(jobProfilesTable)
      .set({
        title: body.title,
        department: body.department ?? "",
        description: body.description,
        requiredSkills: JSON.stringify(body.requiredSkills),
        preferredSkills: JSON.stringify(body.preferredSkills),
        minExperienceYears: body.minExperienceYears,
        updatedAt: new Date(),
      })
      .where(eq(jobProfilesTable.refNo, req.params.refNo))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(parseProfile(updated));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update job profile" });
  }
});

router.delete("/job-profiles/:refNo", async (req, res) => {
  try {
    await db.delete(jobProfilesTable).where(eq(jobProfilesTable.refNo, req.params.refNo));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete job profile" });
  }
});

export default router;
