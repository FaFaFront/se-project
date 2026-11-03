"use client";

import { useId } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PriceRangeFilter } from "@/features/tutors/price-range-filter";
import { cn } from "@/lib/utils";
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
  const searchId = useId();

  return (
    <div className="gap-lg flex flex-col">
      <div className="gap-base flex flex-col lg:flex-row lg:items-start">
        <div className="gap-1 flex flex-1 flex-col">
          <label
            htmlFor={searchId}
            className="text-ink-black text-sm leading-[23px] font-semibold md:text-base md:leading-[26px]"
          >
            Search
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="text-placeholder pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              id={searchId}
              type="search"
              placeholder="Search tutors by name"
              value={query.search}
              onChange={(event) => onChange({ search: event.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <PriceRangeFilter
          className="w-full lg:w-44"
          maxPrice={query.maxPrice}
          onChange={onChange}
          error={priceError}
        />

        <div className="gap-sm flex items-end lg:ml-auto">
          <Select
            label="Sort by"
            className="w-full lg:w-44"
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

      <fieldset className="gap-sm flex flex-col">
        <legend className="sr-only">Subject</legend>
        <div className="gap-sm flex flex-wrap" role="group" aria-label="Filter by subject">
          <button
            type="button"
            onClick={() => onChange({ subjectId: "" })}
            aria-pressed={query.subjectId === ""}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              query.subjectId === ""
                ? "border-primary bg-primary text-white"
                : "border-hairline text-ink hover:border-primary bg-white"
            )}
          >
            All subjects
          </button>
          {subjects.map((subject) => {
            const isActive = query.subjectId === subject.id;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onChange({ subjectId: isActive ? "" : subject.id })}
                aria-pressed={isActive}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-hairline text-ink hover:border-primary bg-white"
                )}
              >
                {subject.name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
