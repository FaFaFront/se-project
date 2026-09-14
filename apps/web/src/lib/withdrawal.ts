/** Parse decimal input without floating-point arithmetic; values are integer satang. */
export function withdrawalCents(value: string): number | null {
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents <= 999999999999 ? cents : null;
}

export function formatTHB(cents: number): string {
  return new Intl.NumberFormat("en-TH", {
    style: "currency",
    currency: "THB",
    currencyDisplay: "narrowSymbol",
  }).format(cents / 100);
}
