import { prisma } from "../config/prisma.js";
import type { User } from "@prisma/client";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileUrl: true,
  bio: true,
  hourlyRate: true,
  gradeLevel: true,
  goals: true,
  walletBalance: true,
  profileComplete: true,
  createdAt: true,
} as const;

export type PublicUser = Omit<User, "passwordHash">;

export const userRepository = {
  async updateProfile(userId: string, data: Partial<User>): Promise<PublicUser> {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  },
};
