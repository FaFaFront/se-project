import { Router } from "express";
import { subjectController } from "../controller/subject.controller.js";

export const subjectRouter = Router();

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: List all subjects
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: List of subjects
 */
subjectRouter.get("/", subjectController.getAllSubjects);
