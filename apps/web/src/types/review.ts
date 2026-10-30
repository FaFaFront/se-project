/** Longest comment the API accepts, after trimming. */
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

/** A student's review of a completed classroom; it cannot be edited or deleted. */
export type Review = {
  id: string;
  /** Whole stars, 1–5. */
  rating: number;
  comment: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
};

/** A review on the public tutor page, with only the reviewer's display details. */
export type TutorReview = Review & {
  student: { name: string | null; profileUrl: string | null };
};

/** Body of `POST /classrooms/:classroomId/review`. */
export type CreateReviewRequest = {
  rating: number;
  comment?: string;
};
