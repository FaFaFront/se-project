import { prisma } from "../config/prisma.js";
import type { User } from "@prisma/client";

export const userRepository = {
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },
};
