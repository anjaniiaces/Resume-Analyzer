import { pgTable, text, integer, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysisResultsTable = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  refNo: text("ref_no").notNull(),
  candidateName: text("candidate_name").notNull().default(""),
  candidateEmail: text("candidate_email").notNull().default(""),
  candidatePhone: text("candidate_phone").notNull().default(""),
  candidateAddress: text("candidate_address").notNull().default(""),
  profileSummary: text("profile_summary").notNull().default(""),
  atsScore: real("ats_score").notNull().default(0),
  suitability: text("suitability").notNull().default(""),
  matchingSkills: text("matching_skills").notNull().default("[]"),
  skillsGap: text("skills_gap").notNull().default("[]"),
  experienceSummary: text("experience_summary").notNull().default(""),
  yearsExperience: real("years_experience").notNull().default(0),
  recommendation: text("recommendation").notNull().default(""),
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResultsTable).omit({ id: true, analyzedAt: true });
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type AnalysisResult = typeof analysisResultsTable.$inferSelect;
