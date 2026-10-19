import type { AccountStatus, Role, User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export type AccountStatusRow = {
  id: string;
  accountStatus: AccountStatus;
};

export const authRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },

  async findAccountStatusById(userId: string): Promise<AccountStatusRow | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, accountStatus: true },
    });
  },

  async create(email: string, passwordHash: string, role: Role): Promise<User> {
    return prisma.user.create({ data: { email, passwordHash, role } });
  },
};
