import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { reviewSelect, type ReviewRow } from "../common/db/review.js";

const tutorReviewSelect = {
  ...reviewSelect,
  // Reviews are public on the tutor page, so only the reviewer's display details are exposed.
  student: { select: { name: true, profileUrl: true } },
} as const satisfies Prisma.ReviewSelect;

export type TutorReviewRow = Prisma.ReviewGetPayload<{ select: typeof tutorReviewSelect }>;

export const reviewRepository = {
  async create(data: {
    classroomId: string;
    studentId: string;
    tutorId: string;
    rating: number;
    comment: string | null;
  }): Promise<ReviewRow> {
    return prisma.review.create({ data, select: reviewSelect });
  },

  /** Newest first; id breaks ties between reviews created in the same instant. */
  async findByTutor(tutorId: string): Promise<TutorReviewRow[]> {
    return prisma.review.findMany({
      where: { tutorId },
      select: tutorReviewSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  },
};
