import type { Task } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const taskRepository = {
  async findAll(): Promise<Task[]> {
    return prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  },

  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({ where: { id } });
  },

  async create(input: { title: string }): Promise<Task> {
    return prisma.task.create({ data: input });
  },

  async update(id: string, input: { done: boolean }): Promise<Task> {
    return prisma.task.update({ where: { id }, data: input });
  },

  async remove(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  },
};
