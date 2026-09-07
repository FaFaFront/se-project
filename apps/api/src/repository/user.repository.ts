import { prisma } from "../config/prisma.js";
import type { Prisma, User } from "@prisma/client";

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

const profileSelect = {
  ...publicUserSelect,
  tutorSubjects: {
    select: {
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

export type PublicUser = Omit<User, "passwordHash">;
export type UserProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

export const userRepository = {
  async updateProfile(userId: string, data: Partial<User>): Promise<PublicUser> {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  },
  async findById(userId: string): Promise<UserProfileRow | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });
  },
};
