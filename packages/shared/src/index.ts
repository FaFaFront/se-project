// Supported mock destinations; this is not bank ownership verification.
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

export type ThaiBankCode = (typeof WITHDRAWAL_BANKS)[number]["value"];
// The source is a nonempty tuple; preserve that guarantee for z.enum.
export const THAI_BANK_CODES = WITHDRAWAL_BANKS.map(({ value }) => value) as [
  ThaiBankCode,
  ...ThaiBankCode[],
];
