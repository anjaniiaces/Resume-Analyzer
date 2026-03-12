import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobProfilesRouter from "./jobProfiles";
import resumesRouter from "./resumes";
import analysisRouter from "./analysis";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobProfilesRouter);
router.use(resumesRouter);
router.use(analysisRouter);
router.use(reportsRouter);

export default router;
