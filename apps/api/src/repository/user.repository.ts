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

export type PublicUser = Omit<User, "passwordHash">;

export type ProfileOwner = Pick<User, "id" | "role" | "profileComplete">;

type CommonProfileUpdate = Pick<User, "name" | "profileUrl" | "bio">;

export type ExistingProfileUpdate =
  | (CommonProfileUpdate &
      Pick<User, "gradeLevel" | "goals"> & {
        gradeLevel: string;
        goals: string;
        hourlyRate?: never;
      })
  | (CommonProfileUpdate & {
      hourlyRate: Prisma.Decimal;
      gradeLevel?: never;
      goals?: never;
    });

export const userRepository = {
  async updateProfile(userId: string, data: Partial<User>): Promise<PublicUser> {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  },

  async findProfileOwnerById(userId: string): Promise<ProfileOwner | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        profileComplete: true,
      },
    });
  },

  async updateExistingProfile(userId: string, data: ExistingProfileUpdate): Promise<PublicUser> {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  },
};
