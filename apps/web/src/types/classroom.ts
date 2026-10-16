import type { Subject } from "@/types/subject";

export type ClassroomStatus = "active" | "completed";

/** Status filter on the tutor's classroom list; "all" sends no status filter. */
export type ClassroomStatusFilter = ClassroomStatus | "all";

/** Limited student summary — the API never includes contact details. */
export type ClassroomStudentSummary = {
  id: string;
  name: string | null;
  profileUrl: string | null;
};

/** One row of `GET /classrooms`. */
export type ClassroomListItem = {
  id: string;
  student: ClassroomStudentSummary;
  subject: Subject;
  pricePerHour: number;
  status: ClassroomStatus;
  /** ISO 8601 timestamp. */
  createdAt: string;
};

export type ClassroomListQuery = {
  search: string;
  subjectId: string;
  status: ClassroomStatusFilter;
};
