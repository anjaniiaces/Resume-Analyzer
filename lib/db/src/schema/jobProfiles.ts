import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobProfilesTable = pgTable("job_profiles", {
  id: serial("id").primaryKey(),
  refNo: text("ref_no").notNull().unique(),
  title: text("title").notNull(),
  department: text("department").notNull().default(""),
  description: text("description").notNull(),
  requiredSkills: text("required_skills").notNull().default("[]"),
  preferredSkills: text("preferred_skills").notNull().default("[]"),
  minExperienceYears: integer("min_experience_years").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobProfileSchema = createInsertSchema(jobProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobProfile = z.infer<typeof insertJobProfileSchema>;
export type JobProfile = typeof jobProfilesTable.$inferSelect;
