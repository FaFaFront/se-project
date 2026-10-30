import type { TutorReview } from "@/types/review";
import type { Subject } from "@/types/subject";

export type TutorSortBy = "rating" | "price" | "popularity";
export type SortOrder = "asc" | "desc";

/** One row of `GET /tutors`. */
export type TutorListItem = {
  id: string;
  name: string | null;
  profileUrl: string | null;
  bio: string | null;
  hourlyRate: number | null;
  subjects: Subject[];
  /** Average review score out of 5; null when the tutor has no reviews yet. */
  rating: number | null;
  reviewCount: number;
  /** Distinct students who have learned with the tutor. */
  studentCount: number;
};

/** `GET /tutors/:id`: a list item plus every review, newest first. */
export type TutorDetail = TutorListItem & { reviews: TutorReview[] };

export type TutorListQuery = {
  search: string;
  subjectId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: TutorSortBy;
  order: SortOrder;
};
