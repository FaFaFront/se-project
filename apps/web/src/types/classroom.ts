import type { Review } from "@/types/review";
import type { Subject } from "@/types/subject";

export type ClassroomStatus = "active" | "completed";

// Shared by the card badge and the status filter so tutors see one term per state.
export const CLASSROOM_STATUS_LABEL: Record<ClassroomStatus, string> = {
  active: "Active",
  completed: "Completed",
};

/** Status filter on the tutor's classroom list; "all" sends no status filter. */
export type ClassroomStatusFilter = ClassroomStatus | "all";

export type ClassroomParticipant = {
  id: string;
  name: string | null;
  profileUrl: string | null;
};

/** Limited student summary — the API never includes contact details. */
export type ClassroomStudentSummary = ClassroomParticipant;

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

type ClassroomDetailBase = {
  id: string;
  subject: {
    id: string;
    name: string;
  };
  participant: ClassroomParticipant;
  pricePerHour: number;
  status: ClassroomStatus;
  /** The student's review; null until one is submitted. */
  review: Review | null;
};

export type TutorClassroomDetail = ClassroomDetailBase & {
  viewerRole: "tutor";
  createdAt: string;
};

export type StudentClassroomDetail = ClassroomDetailBase & {
  viewerRole: "student";
};

export type ClassroomDetail = TutorClassroomDetail | StudentClassroomDetail;

export type Classroom = {
  id: string;
  tutorId: string;
  studentId: string;
  subjectId: string;
  pricePerHour: number;
  status: ClassroomStatus;
  createdAt: string;
};

/** Body of `PATCH /classrooms/:classroomId`; both fields are required. */
export type UpdateClassroomRequest = {
  subjectId: string;
  pricePerHour: number;
};

export type CreateClassroomRequest = {
  conversationId: string;
  subjectId: string;
  pricePerHour?: number;
};

export type DeactivateClassroomResponse = {
  id: string;
  status: "completed";
};
