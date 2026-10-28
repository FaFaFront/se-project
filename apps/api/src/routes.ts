import { Router } from "express";
import { authRouter } from "./router/auth.router.js";
import { classroomRouter } from "./router/classroom.router.js";
import { conversationRouter } from "./router/conversation.router.js";
import { sessionRouter } from "./router/session.router.js";
import { subjectRouter } from "./router/subject.router.js";
import { tutorRouter } from "./router/tutor.router.js";
import { uploadRouter } from "./router/upload.router.js";
import { userRouter } from "./router/user.router.js";
import { transactionRouter } from "./router/transaction.router.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRouter);
apiRoutes.use("/classrooms", classroomRouter);
apiRoutes.use("/conversations", conversationRouter);
apiRoutes.use("/sessions", sessionRouter);
apiRoutes.use("/subjects", subjectRouter);
apiRoutes.use("/tutors", tutorRouter);
apiRoutes.use("/upload", uploadRouter);
apiRoutes.use("/users", userRouter);
apiRoutes.use("/transactions", transactionRouter);
