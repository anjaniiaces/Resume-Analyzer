import { Router, type IRouter } from "express";
import multer from "multer";
import { db, resumesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function parseResume(row: typeof resumesTable.$inferSelect) {
  return {
    ...row,
    candidateName: row.candidateName || undefined,
    candidateEmail: row.candidateEmail || undefined,
    candidatePhone: row.candidatePhone || undefined,
    candidateAddress: row.candidateAddress || undefined,
    analysisId: row.analysisId || undefined,
  };
}

router.get("/resumes", async (req, res) => {
  try {
    const refNo = req.query.refNo as string | undefined;
    const resumes = refNo
      ? await db.select().from(resumesTable).where(eq(resumesTable.refNo, refNo)).orderBy(resumesTable.uploadedAt)
      : await db.select().from(resumesTable).orderBy(resumesTable.uploadedAt);
    res.json(resumes.map(parseResume));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list resumes" });
  }
});

router.post("/resumes/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const refNo = req.body.refNo as string;
    if (!refNo) return res.status(400).json({ error: "refNo is required" });

    const fileName = req.file.originalname || req.body.fileName || "resume.txt";
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    let textContent: string;
    if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
      textContent = fileBuffer.toString("utf-8");
    } else {
      textContent = `[Binary file: ${fileName}]\n\nFile content (${mimeType}):\n${fileBuffer.toString("base64").substring(0, 5000)}`;
    }

    const [created] = await db.insert(resumesTable).values({
      refNo,
      fileName,
      originalText: textContent,
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      candidateAddress: "",
      analysisId: null,
    }).returning();

    res.status(201).json(parseResume(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

router.get("/resumes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.id, id));
    if (!resume) return res.status(404).json({ error: "Not found" });
    res.json(parseResume(resume));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get resume" });
  }
});

router.delete("/resumes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(resumesTable).where(eq(resumesTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

export default router;
