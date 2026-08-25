import { Router } from "express";
import { subjectRouter } from "./router/subject.router.js";

export const apiRoutes = Router();

apiRoutes.use("/subjects", subjectRouter);
