import { Router } from "express";
import { authRouter } from "./router/auth.router.js";
import { subjectRouter } from "./router/subject.router.js";
import { userRouter } from "./router/user.router.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRouter);
apiRoutes.use("/subjects", subjectRouter);
apiRoutes.use("/users", userRouter);
apiRoutes.use("/auth", authRouter);
