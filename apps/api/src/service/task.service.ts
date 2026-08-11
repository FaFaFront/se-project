import type { Task } from "@prisma/client";
import { taskRepository } from "../repository/task.repository.js";
import { NotFoundError } from "../common/errors/app-error.js";

export const taskService = {
  async getAllTasks(): Promise<Task[]> {
    return taskRepository.findAll();
  },

  async getTaskById(id: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    return task;
  },

  async createTask(input: { title: string }): Promise<Task> {
    return taskRepository.create(input);
  },

  async updateTask(id: string, input: { done: boolean }): Promise<Task> {
    await taskService.getTaskById(id);
    return taskRepository.update(id, input);
  },

  async deleteTask(id: string): Promise<void> {
    await taskService.getTaskById(id);
    await taskRepository.remove(id);
  },
};
