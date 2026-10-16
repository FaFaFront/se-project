import { Router } from "express";
import { authRouter } from "./router/auth.router.js";
import { classroomRouter } from "./router/classroom.router.js";
import { conversationRouter } from "./router/conversation.router.js";
import { subjectRouter } from "./router/subject.router.js";
import { userRouter } from "./router/user.router.js";
import { walletRouter } from "./router/wallet.router.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRouter);
apiRoutes.use("/classrooms", classroomRouter);
apiRoutes.use("/conversations", conversationRouter);
apiRoutes.use("/subjects", subjectRouter);
apiRoutes.use("/users", userRouter);
apiRoutes.use("/wallet", walletRouter);
