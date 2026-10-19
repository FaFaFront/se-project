"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TutorCard } from "@/features/tutors/tutor-card";
import { DEFAULT_SORT_ORDER, TutorFilters } from "@/features/tutors/tutor-filters";
import { apiClient } from "@/lib/api-client";
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
        if (!isStale) setTutors(data);
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

  return (
    <div className="gap-xl flex flex-col">
      <TutorFilters
        query={query}
        subjects={subjects}
        onChange={handleChange}
        priceError={priceError}
      />

      {/* Always mounted so screen readers announce every change, errors included. */}
      <p role="status" className="text-ink text-sm">
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
          {!isLoading && tutors.length === 0 ? (
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
            <ul
              className={`gap-base grid sm:grid-cols-2 lg:grid-cols-3 ${isLoading ? "opacity-60" : ""}`}
            >
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
