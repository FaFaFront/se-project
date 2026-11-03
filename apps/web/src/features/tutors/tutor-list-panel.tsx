"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TutorCard } from "@/features/tutors/tutor-card";
import { TutorListSkeleton } from "@/features/tutors/tutor-card-skeleton";
import { DEFAULT_SORT_ORDER, TutorFilters } from "@/features/tutors/tutor-filters";
import { TutorsHero } from "@/features/tutors/tutors-hero";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/subject";
import type { TutorListItem, TutorListQuery } from "@/types/tutor";

const INITIAL_QUERY: TutorListQuery = {
  search: "",
  subjectId: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "rating",
  order: DEFAULT_SORT_ORDER.rating,
};

// Long enough that typing a name or a price fires one request, not one per key.
const DEBOUNCE_MS = 300;

const PAGE_SIZE = 9;

function getPriceError({ minPrice, maxPrice }: TutorListQuery): string | null {
  const min = minPrice === "" ? undefined : Number(minPrice);
  const max = maxPrice === "" ? undefined : Number(maxPrice);
  if ((min !== undefined && min < 0) || (max !== undefined && max < 0)) {
    return "Prices must not be negative.";
  }
  if (min !== undefined && max !== undefined && min > max) {
    return "Minimum price must not exceed maximum price.";
  }
  return null;
}

function toSearchParams(query: TutorListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const trimmed = value.trim();
    if (trimmed) params.set(key, trimmed);
  }
  return params.toString();
}

/** Public tutor directory: search, subject/price filters, and sort, all combined server-side. */
export function TutorListPanel() {
  const [query, setQuery] = useState<TutorListQuery>(INITIAL_QUERY);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<TutorListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);

  const priceError = getPriceError(query);

  useEffect(() => {
    apiClient
      .get<Subject[]>("/subjects")
      .then(setSubjects)
      // The subject filter just stays at "All subjects" if this fails.
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (getPriceError(debouncedQuery)) return;

    // Drop responses that land after a newer query has already been sent.
    let isStale = false;
    setIsLoading(true);
    setError(null);

    apiClient
      .get<TutorListItem[]>(`/tutors?${toSearchParams(debouncedQuery)}`)
      .then((data) => {
        if (!isStale) {
          setTutors(data);
          setPage(1);
        }
      })
      .catch((err: unknown) => {
        if (!isStale) setError(err instanceof Error ? err.message : "Unable to load tutors.");
      })
      .finally(() => {
        if (!isStale) setIsLoading(false);
      });

    return () => {
      isStale = true;
    };
  }, [debouncedQuery, reloadKey]);

  const handleChange = useCallback((patch: Partial<TutorListQuery>) => {
    setQuery((current) => ({ ...current, ...patch }));
  }, []);

  const isFiltered =
    query.search !== "" || query.subjectId !== "" || query.minPrice !== "" || query.maxPrice !== "";

  const pageCount = Math.max(1, Math.ceil(tutors.length / PAGE_SIZE));
  const visibleTutors = tutors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="gap-xl flex flex-col">
      <TutorsHero />

      <TutorFilters
        query={query}
        subjects={subjects}
        onChange={handleChange}
        priceError={priceError}
      />

      {/* Always mounted so screen readers announce every change, errors included.
          Loading and the result count are only announced, not shown — the skeleton and
          grid already show that visually. Errors stay visible. */}
      <p role="status" className={cn("text-ink text-sm", !priceError && !error && "sr-only")}>
        {priceError
          ? "Fix the price range to see results."
          : error
            ? error
            : isLoading
              ? "Loading tutors…"
              : `${tutors.length} ${tutors.length === 1 ? "tutor" : "tutors"} found`}
      </p>

      {priceError ? null : error ? (
        <div className="flex justify-center py-6">
          <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      ) : (
        <section aria-busy={isLoading} className="gap-base flex flex-col">
          {isLoading ? (
            <TutorListSkeleton count={PAGE_SIZE} />
          ) : tutors.length === 0 ? (
            <div className="border-hairline gap-md flex flex-col items-center rounded-[10px] border border-dashed py-12 text-center">
              <p className="text-ink-black text-body-emphasis">No tutors match your criteria</p>
              {isFiltered && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setQuery((current) => ({
                      ...INITIAL_QUERY,
                      sortBy: current.sortBy,
                      order: current.order,
                    }))
                  }
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <ul className="gap-base grid sm:grid-cols-2 lg:grid-cols-3">
                {visibleTutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </ul>

              {pageCount > 1 && (
                <nav
                  aria-label="Tutor results pages"
                  className="gap-base flex items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="border-hairline text-ink hover:border-primary focus-visible:border-primary flex size-10 shrink-0 items-center justify-center rounded-[10px] border bg-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </button>
                  <p className="text-ink text-sm">
                    Page {page} of {pageCount}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page === pageCount}
                    aria-label="Next page"
                    className="border-hairline text-ink hover:border-primary focus-visible:border-primary flex size-10 shrink-0 items-center justify-center rounded-[10px] border bg-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
