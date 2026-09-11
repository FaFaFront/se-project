import { prisma } from "../config/prisma.js";

export const walletRepository = {
  findUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, walletBalance: true },
    });
  },

  incrementBalance(userId: string, amount: number) {
    return prisma.user.update({
      where: { id: userId, role: "student" },
      data: { walletBalance: { increment: amount } },
      select: { walletBalance: true },
    });
  },
};
