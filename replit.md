# Workspace

## Overview

pnpm workspace monorepo using TypeScript. ATS Resume Checker application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui

## Application: ATS Resume Checker (MatchPoint)

A full-stack ATS (Applicant Tracking System) resume checker that:
- Manages job profiles with reference numbers
- Accepts resume uploads (PDF/DOCX/TXT) per job reference
- Uses AI to analyze resumes against job descriptions
- Extracts candidate name, contact, and address
- Generates ATS scores, suitability ratings, matching skills, skills gaps, experience summaries
- Produces tabulated summary sheets per reference number
- Exports reports to CSV

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── ats-checker/        # React + Vite frontend (ATS Checker)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/  # OpenAI integration
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `job_profiles` - Job reference numbers and requirements
- `resumes` - Uploaded resume files and extracted candidate info
- `analysis_results` - ATS analysis results per resume

## API Routes

- `GET/POST /api/job-profiles` - List/create job profiles
- `GET/PUT/DELETE /api/job-profiles/:refNo` - Manage specific profile
- `GET /api/resumes` - List resumes (filter by refNo)
- `POST /api/resumes/upload` - Upload a resume (multipart)
- `GET/DELETE /api/resumes/:id` - Get/delete resume
- `POST /api/analysis/:resumeId` - Run ATS analysis on one resume
- `POST /api/analysis/batch` - Analyze all resumes for a refNo
- `GET /api/reports/:refNo` - Get summary report
- `GET /api/reports/:refNo/export` - Export report as CSV

## Frontend Routes

- `/` - Dashboard with stats
- `/profiles` - Job profile management
- `/resumes` - Resume upload and management
- `/analysis` - Analysis results browser
- `/reports` - Summary reports and CSV export
