"use client";

import { Select } from "@/components/ui/select";

const MAX_PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "Under ฿300", value: "300" },
  { label: "Under ฿600", value: "600" },
  { label: "Under ฿900", value: "900" },
  { label: "Under ฿1200", value: "1200" },
];

export interface PriceRangeFilterProps {
  maxPrice: string;
  onChange: (patch: { maxPrice: string }) => void;
  error?: string | null;
  className?: string;
}

/** A simple "price under X" threshold — easier to scan than a min/max pair. */
export function PriceRangeFilter({ maxPrice, onChange, error, className }: PriceRangeFilterProps) {
  return (
    <Select
      label="Price per hour"
      className={className}
      value={maxPrice}
      onValueChange={(value) => onChange({ maxPrice: value })}
      options={MAX_PRICE_OPTIONS}
      error={Boolean(error)}
      errorMessage={error ?? undefined}
    />
  );
}
