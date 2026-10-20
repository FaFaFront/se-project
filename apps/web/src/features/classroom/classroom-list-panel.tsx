"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ClassroomCard } from "@/features/classroom/classroom-card";
import { ClassroomFilters } from "@/features/classroom/classroom-filters";
import { apiClient } from "@/lib/api-client";
import type { ClassroomListItem, ClassroomListQuery } from "@/types/classroom";
import type { Subject } from "@/types/subject";

/** The default view — and what "Clear filters" restores: every active classroom. */
const INITIAL_QUERY: ClassroomListQuery = { search: "", subjectId: "", status: "active" };

// Long enough that typing a name fires one request, not one per key.
const SEARCH_DEBOUNCE_MS = 300;

function toSearchParams(query: ClassroomListQuery): string {
  const params = new URLSearchParams();
  const search = query.search.trim();
  if (search) params.set("search", search);
  if (query.subjectId) params.set("subjectId", query.subjectId);
  params.set("status", query.status);
  return params.toString();
}

function isDefaultQuery(query: ClassroomListQuery): boolean {
  return (
    query.search.trim() === "" &&
    query.subjectId === INITIAL_QUERY.subjectId &&
    query.status === INITIAL_QUERY.status
  );
}

/** Tutor's own classrooms: search plus subject/status filters, all combined server-side. */
function TutorClassroomList() {
  const [query, setQuery] = useState<ClassroomListQuery>(INITIAL_QUERY);
  const [debouncedSearch, setDebouncedSearch] = useState(query.search);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [subjectsReloadKey, setSubjectsReloadKey] = useState(0);
  const [classrooms, setClassrooms] = useState<ClassroomListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Only free text is debounced; picking a subject or status should update right away.
  const requestQuery = useMemo(
    () => ({ ...query, search: debouncedSearch }),
    [query, debouncedSearch]
  );
  const searchParams = toSearchParams(requestQuery);
  const isSearchPending = query.search.trim() !== debouncedSearch.trim();

  useEffect(() => {
    let isStale = false;
    setSubjectsError(null);

    apiClient
      .get<Subject[]>("/subjects")
      .then((data) => {
        if (!isStale) setSubjects(data);
      })
      // The list itself still works; only the subject filter is limited to "All subjects".
      .catch((err: unknown) => {
        if (!isStale) {
          setSubjectsError(err instanceof Error ? err.message : "Unable to load subjects.");
        }
      });

    return () => {
      isStale = true;
    };
  }, [subjectsReloadKey]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(query.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query.search]);

  useEffect(() => {
    // Drop responses that land after a newer query has already been sent.
    let isStale = false;
    setIsLoading(true);
    setError(null);

    apiClient
      .get<ClassroomListItem[]>(`/classrooms?${searchParams}`)
      .then((data) => {
        if (!isStale) setClassrooms(data);
      })
      .catch((err: unknown) => {
        if (isStale) return;
        // Clear results so an older list is never shown as the answer to this query.
        setClassrooms(null);
        setError(err instanceof Error ? err.message : "Unable to load classrooms.");
      })
      .finally(() => {
        if (!isStale) setIsLoading(false);
      });

    return () => {
      isStale = true;
    };
  }, [searchParams, reloadKey]);

  const isBusy = isLoading || isSearchPending;
  const isDefault = isDefaultQuery(query);
  const clearFilters = () => {
    setQuery(INITIAL_QUERY);
    // Skip the debounce so the cleared filters aren't sent with the old search first.
    setDebouncedSearch(INITIAL_QUERY.search);
  };

  return (
    <div className="gap-xl flex flex-col">
      <ClassroomFilters
        query={query}
        subjects={subjects}
        onChange={(patch) => setQuery((current) => ({ ...current, ...patch }))}
        onClear={isDefault ? undefined : clearFilters}
      />

      {subjectsError && (
        <div role="alert" className="gap-sm text-error flex flex-wrap items-center text-sm">
          <span>Couldn&apos;t load the subject filter: {subjectsError}</span>
          <Button variant="outline" onClick={() => setSubjectsReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      )}

      {/* Always mounted so screen readers announce every change, errors included. */}
      <p role="status" className="text-ink text-sm">
        {error
          ? error
          : isBusy || classrooms === null
            ? "Loading classrooms…"
            : `${classrooms.length} ${classrooms.length === 1 ? "classroom" : "classrooms"} found`}
      </p>

      {error ? (
        <div className="flex justify-center py-6">
          <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      ) : classrooms === null ? (
        <ClassroomListSkeleton />
      ) : !isBusy && classrooms.length === 0 ? (
        <EmptyState
          query={query}
          onShowAll={() => setQuery({ ...INITIAL_QUERY, status: "all" })}
          onClear={clearFilters}
        />
      ) : (
        <section aria-busy={isBusy}>
          <ul
            className={`gap-base grid sm:grid-cols-2 lg:grid-cols-3 ${isBusy ? "opacity-60" : ""}`}
          >
            {classrooms.map((classroom) => (
              <ClassroomCard key={classroom.id} classroom={classroom} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ClassroomListSkeleton() {
  return (
    <ul aria-hidden="true" className="gap-base grid sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <li
          key={index}
          className="border-hairline bg-surface-lavender/40 h-36 animate-pulse rounded-[10px] border"
        />
      ))}
    </ul>
  );
}

interface EmptyStateProps {
  query: ClassroomListQuery;
  onShowAll: () => void;
  onClear: () => void;
}

/**
 * Three different "nothing here" cases: no classrooms at all, none active in
 * the default view, and none matching the tutor's own search/filters.
 */
function EmptyState({ query, onShowAll, onClear }: EmptyStateProps) {
  const hasSearchOrSubject = query.search.trim() !== "" || query.subjectId !== "";

  let title: string;
  let action: { label: string; onClick: () => void } | null;
  if (!hasSearchOrSubject && query.status === "all") {
    title = "You don't have any classrooms yet";
    action = null;
  } else if (isDefaultQuery(query)) {
    title = "You have no active classrooms";
    action = { label: "Show all classrooms", onClick: onShowAll };
  } else {
    title = "No classrooms match your search and filters";
    action = { label: "Clear filters", onClick: onClear };
  }

  return (
    <div className="border-hairline gap-md flex flex-col items-center rounded-[10px] border border-dashed px-4 py-12 text-center">
      <p className="text-ink-black text-body-emphasis">{title}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * My Classroom entry point. The detail route is available to tutors and
 * students, while this searchable list endpoint currently belongs to tutors.
 */
export function ClassroomListPanel() {
  const { profile } = useAuth();

  if (profile?.role !== "tutor") {
    return (
      <p className="text-ink text-sm">The classroom list is currently available for tutors only.</p>
    );
  }

  // Keyed by user so switching accounts never shows the previous tutor's list.
  return <TutorClassroomList key={profile.id} />;
}
