export type WalletBalance = { walletBalance: string };

export type Wallet = WalletBalance & { topUpAmounts: number[] };
