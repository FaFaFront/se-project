"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CLASSROOM_STATUS_LABEL,
  type ClassroomListQuery,
  type ClassroomStatusFilter,
} from "@/types/classroom";
import type { Subject } from "@/types/subject";

const STATUS_OPTIONS: { label: string; value: ClassroomStatusFilter }[] = [
  { label: CLASSROOM_STATUS_LABEL.active, value: "active" },
  { label: CLASSROOM_STATUS_LABEL.completed, value: "completed" },
  { label: "All", value: "all" },
];

export interface ClassroomFiltersProps {
  query: ClassroomListQuery;
  subjects: Subject[];
  onChange: (patch: Partial<ClassroomListQuery>) => void;
  /** Shown only while the query differs from the default view. */
  onClear?: () => void;
}

export function ClassroomFilters({ query, subjects, onChange, onClear }: ClassroomFiltersProps) {
  return (
    <div className="gap-base flex flex-col md:flex-row md:items-end">
      <div className="relative md:flex-1">
        <Search
          aria-hidden="true"
          className="text-placeholder pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          aria-label="Search by student or subject"
          placeholder="Search by student or subject"
          value={query.search}
          onChange={(event) => onChange({ search: event.target.value })}
          className="pl-9"
        />
      </div>

      <div className="gap-base flex flex-col sm:flex-row sm:items-end">
        <Select
          label="Subject"
          className="w-full sm:w-56"
          value={query.subjectId}
          onValueChange={(subjectId) => onChange({ subjectId })}
          options={[
            { label: "All subjects", value: "" },
            ...subjects.map((subject) => ({ label: subject.name, value: subject.id })),
          ]}
        />
        <Select
          label="Status"
          className="w-full sm:w-40"
          value={query.status}
          onValueChange={(status) => onChange({ status: status as ClassroomStatusFilter })}
          options={STATUS_OPTIONS}
        />
        {onClear && (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
