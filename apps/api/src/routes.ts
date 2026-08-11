import { Router } from "express";
import { taskRouter } from "./router/task.router.js";

export const apiRoutes = Router();

apiRoutes.use("/tasks", taskRouter);
