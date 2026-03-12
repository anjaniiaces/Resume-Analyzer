import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  refNo: text("ref_no").notNull(),
  fileName: text("file_name").notNull(),
  originalText: text("original_text").notNull(),
  candidateName: text("candidate_name").notNull().default(""),
  candidateEmail: text("candidate_email").notNull().default(""),
  candidatePhone: text("candidate_phone").notNull().default(""),
  candidateAddress: text("candidate_address").notNull().default(""),
  analysisId: integer("analysis_id"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({ id: true, uploadedAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
