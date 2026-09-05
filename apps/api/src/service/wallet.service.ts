import { ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { walletRepository } from "../repository/wallet.repository.js";

export const TOP_UP_AMOUNTS = [100, 300, 500, 1000] as const;

async function requireStudent(userId: string) {
  const user = await walletRepository.findUser(userId);
  if (!user) throw new UnauthorizedError("User no longer exists");
  if (user.role !== "student") throw new ForbiddenError("Only students can access top-ups");
  return user;
}

export const walletService = {
  async getWallet(userId: string) {
    const user = await requireStudent(userId);
    return { walletBalance: user.walletBalance, topUpAmounts: TOP_UP_AMOUNTS };
  },

  async topUp(userId: string, amount: number) {
    await requireStudent(userId);
    // Demo credit only: no payment provider or money transfer is involved.
    return walletRepository.incrementBalance(userId, amount);
  },
};
