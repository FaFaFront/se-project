import { Router } from "express";
import { subjectRouter } from "./router/subject.router.js";
import { userRouter } from "./router/user.router.js";

export const apiRoutes = Router();

apiRoutes.use("/subjects", subjectRouter);
apiRoutes.use("/users", userRouter);
