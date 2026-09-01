import type { Role, User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const authRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },

  async create(
    name: string,
    email: string,
    passwordHash: string,
    role: Role,
    profileUrl: string
  ): Promise<User> {
    return prisma.user.create({ data: { name, email, passwordHash, role, profileUrl } });
  },
};
