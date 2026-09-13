import type { ThaiBankCode } from "@tutorist/shared";
export { WITHDRAWAL_BANKS } from "@tutorist/shared";

export type WithdrawalRequest = {
  requestId: string;
  amount: number;
  bankCode: ThaiBankCode;
  accountNumber: string;
  accountHolderName: string;
  password: string;
};

export type Withdrawal = {
  id: string;
  amount: string;
  currency: "THB";
  status: "completed";
  destination: {
    bankCode: WithdrawalRequest["bankCode"];
    accountNumberMasked: string;
    accountHolderName: string;
  };
  requestedAt: string;
  completedAt: string;
  balanceAfter: string;
};
