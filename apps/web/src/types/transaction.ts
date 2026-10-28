export type TransactionType = "topup" | "session_charge" | "earning" | "withdrawal";

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: string;
  relatedSessionId: string | null;
  note: string | null;
  createdAt: string;
};

export type TransactionHistory = {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
};

export type TopUpOptions = { topUpAmounts: number[] };
export type TopUpRequest = { requestId: string; amount: number };
export type TopUp = Transaction & { type: "topup"; balanceAfter: string };

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

export type Withdrawal = Transaction & {
  type: "withdrawal";
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
