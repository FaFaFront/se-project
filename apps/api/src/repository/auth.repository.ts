import type { Role, User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const authRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },

  async create(email: string, passwordHash: string, role: Role): Promise<User> {
    return prisma.user.create({ data: { email, passwordHash, role } });
  },
};
