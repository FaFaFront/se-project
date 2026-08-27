import { Router } from "express";
import { subjectRouter } from "./router/subject.router.js";
import { authRouter } from "./router/auth.router.js";

export const apiRoutes = Router();

apiRoutes.use("/subjects", subjectRouter);
apiRoutes.use("/auth", authRouter);
