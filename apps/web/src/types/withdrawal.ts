export const WITHDRAWAL_BANKS = [
  { value: "KBANK", label: "Kasikornbank" },
  { value: "SCB", label: "Siam Commercial Bank" },
  { value: "BBL", label: "Bangkok Bank" },
  { value: "KTB", label: "Krungthai Bank" },
  { value: "BAY", label: "Bank of Ayudhya (Krungsri)" },
  { value: "TTB", label: "TMBThanachart Bank" },
  { value: "GSB", label: "Government Savings Bank" },
  { value: "BAAC", label: "Bank for Agriculture (BAAC)" },
  { value: "GHB", label: "Government Housing Bank" },
  { value: "KKP", label: "Kiatnakin Phatra Bank" },
  { value: "TISCO", label: "TISCO Bank" },
  { value: "CIMBT", label: "CIMB Thai Bank" },
  { value: "UOB", label: "UOB Thailand" },
] as const;

export type WithdrawalRequest = {
  requestId: string;
  amount: number;
  bankCode: (typeof WITHDRAWAL_BANKS)[number]["value"];
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
