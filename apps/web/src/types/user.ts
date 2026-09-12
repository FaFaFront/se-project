import type { UserRole } from "@/types/auth";
import type { Subject } from "@/types/subject";

/** Shape of `GET /users/me` and the body echoed back by `PATCH /users/me`. */
export type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  profileUrl: string | null;
  bio: string | null;
  /** Tutor only — null for students. */
  hourlyRate: number | null;
  /** Student only — null for tutors. */
  gradeLevel: string | null;
  /** Student only — null for tutors. */
  goals: string | null;
  walletBalance: number;
  createdAt: string;
  /** Subjects the tutor teaches; always empty for students. */
  subjects: Subject[];
};

/** Shape returned by `POST /users/profile` on completion. */
export type PublicUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  profileUrl: string | null;
  bio: string | null;
  hourlyRate: string | null;
  gradeLevel: string | null;
  goals: string | null;
  walletBalance: string;
  profileComplete: boolean;
  createdAt: string;
};
