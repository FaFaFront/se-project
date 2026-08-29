import type { User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const authRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },
};
