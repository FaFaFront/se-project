import type { NextFunction, Request, Response } from "express";
import { subjectService } from "../service/subject.service.js";
import { successResponse } from "../common/utils/response.js";

export const subjectController = {
  async getAllSubjects(_req: Request, res: Response, next: NextFunction) {
    try {
      const subjects = await subjectService.getAllSubjects();
      res.status(200).json(successResponse(subjects));
    } catch (err) {
      next(err);
    }
  },
};
