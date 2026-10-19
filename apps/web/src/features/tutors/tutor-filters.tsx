"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Subject } from "@/types/subject";
import type { SortOrder, TutorListQuery, TutorSortBy } from "@/types/tutor";

const SORT_OPTIONS: { label: string; value: TutorSortBy }[] = [
  { label: "Rating", value: "rating" },
  { label: "Price", value: "price" },
  { label: "Popularity", value: "popularity" },
];

/** Direction each sort starts in when picked: best-rated, cheapest, most popular first. */
export const DEFAULT_SORT_ORDER: Record<TutorSortBy, SortOrder> = {
  rating: "desc",
  price: "asc",
  popularity: "desc",
};

export interface TutorFiltersProps {
  query: TutorListQuery;
  subjects: Subject[];
  onChange: (patch: Partial<TutorListQuery>) => void;
  priceError?: string | null;
}

export function TutorFilters({ query, subjects, onChange, priceError }: TutorFiltersProps) {
  const isAscending = query.order === "asc";

  return (
    <div className="gap-base flex flex-col">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-placeholder pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          aria-label="Search tutors by name"
          placeholder="Search tutors by name"
          value={query.search}
          onChange={(event) => onChange({ search: event.target.value })}
          className="pl-9"
        />
      </div>

      <div className="gap-base flex flex-col md:flex-row md:items-end">
        <Select
          label="Subject"
          className="w-full md:w-56"
          value={query.subjectId}
          onValueChange={(subjectId) => onChange({ subjectId })}
          options={[
            { label: "All subjects", value: "" },
            ...subjects.map((subject) => ({ label: subject.name, value: subject.id })),
          ]}
        />

        <fieldset className="gap-xs flex flex-col">
          <legend className="text-ink-black mb-1 text-sm leading-[23px] font-semibold md:text-base md:leading-[26px]">
            Price per hour
          </legend>
          <div className="gap-sm flex items-center">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              aria-label="Minimum price"
              placeholder="Min"
              value={query.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
              error={Boolean(priceError)}
              wrapperClassName="w-full md:w-28"
            />
            <span aria-hidden="true" className="text-placeholder">
              –
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              aria-label="Maximum price"
              placeholder="Max"
              value={query.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value })}
              error={Boolean(priceError)}
              wrapperClassName="w-full md:w-28"
            />
          </div>
        </fieldset>

        <div className="gap-sm flex items-end md:ml-auto">
          <Select
            label="Sort by"
            className="w-full md:w-44"
            value={query.sortBy}
            onValueChange={(value) => {
              const sortBy = value as TutorSortBy;
              onChange({ sortBy, order: DEFAULT_SORT_ORDER[sortBy] });
            }}
            options={SORT_OPTIONS}
          />
          <button
            type="button"
            onClick={() => onChange({ order: isAscending ? "desc" : "asc" })}
            aria-label={
              isAscending
                ? "Sorted ascending — switch to descending"
                : "Sorted descending — switch to ascending"
            }
            title={isAscending ? "Ascending" : "Descending"}
            className="border-hairline text-ink hover:border-primary focus-visible:border-primary flex size-10 shrink-0 items-center justify-center rounded-[10px] border bg-white outline-none transition-colors"
          >
            {isAscending ? (
              <ArrowUpNarrowWide aria-hidden="true" className="size-4" />
            ) : (
              <ArrowDownWideNarrow aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </div>

      {priceError && (
        <p role="alert" className="text-error text-xs sm:text-sm">
          {priceError}
        </p>
      )}
    </div>
  );
}
