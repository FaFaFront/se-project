import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { taskService } from "../service/task.service.js";
import { successResponse } from "../common/utils/response.js";

const createTaskSchema = z.object({
  title: z.string().min(1, "title is required"),
});

const taskIdParamsSchema = z.object({
  id: z.string().uuid("id must be a valid uuid"),
});

const updateTaskSchema = z.object({
  done: z.boolean(),
});

export const taskController = {
  async getAllTasks(_req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.getAllTasks();
      res.status(200).json(successResponse(tasks));
    } catch (err) {
      next(err);
    }
  },

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = taskIdParamsSchema.parse(req.params);
      const task = await taskService.getTaskById(id);
      res.status(200).json(successResponse(task));
    } catch (err) {
      next(err);
    }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(input);
      res.status(201).json(successResponse(task, "Task created"));
    } catch (err) {
      next(err);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = taskIdParamsSchema.parse(req.params);
      const input = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTask(id, input);
      res.status(200).json(successResponse(task, "Task updated"));
    } catch (err) {
      next(err);
    }
  },

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = taskIdParamsSchema.parse(req.params);
      await taskService.deleteTask(id);
      res.status(200).json(successResponse(null, "Task deleted"));
    } catch (err) {
      next(err);
    }
  },
};
