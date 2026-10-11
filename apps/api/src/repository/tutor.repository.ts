import { AccountStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";

const tutorListSelect = {
  id: true,
  name: true,
  profileUrl: true,
  bio: true,
  hourlyRate: true,
  tutorSubjects: {
    select: {
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

export type TutorListRow = Prisma.UserGetPayload<{ select: typeof tutorListSelect }>;

export type TutorListFilter = {
  search?: string;
  subjectId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type TutorRatingRow = { tutorId: string; averageRating: number | null; reviewCount: number };
export type TutorPopularityRow = { tutorId: string; studentCount: number };

export const tutorRepository = {
  /** Active tutors with a completed profile, narrowed by the given filters. */
  async findActive(filter: TutorListFilter): Promise<TutorListRow[]> {
    const { search, subjectId, minPrice, maxPrice } = filter;

    return prisma.user.findMany({
      where: {
        role: Role.tutor,
        accountStatus: AccountStatus.ACTIVE,
        profileComplete: true,
        ...(search && { name: { contains: search, mode: "insensitive" } }),
        ...(subjectId && { tutorSubjects: { some: { subjectId } } }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
          hourlyRate: {
            ...(minPrice !== undefined && { gte: new Prisma.Decimal(minPrice) }),
            ...(maxPrice !== undefined && { lte: new Prisma.Decimal(maxPrice) }),
          },
        }),
      },
      select: tutorListSelect,
    });
  },

  async findRatings(tutorIds: string[]): Promise<TutorRatingRow[]> {
    if (tutorIds.length === 0) {
      return [];
    }

    const rows = await prisma.review.groupBy({
      by: ["tutorId"],
      where: { tutorId: { in: tutorIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      tutorId: row.tutorId,
      averageRating: row._avg.rating,
      reviewCount: row._count._all,
    }));
  },

  /** Number of distinct students who have had a classroom with each tutor. */
  async findPopularity(tutorIds: string[]): Promise<TutorPopularityRow[]> {
    if (tutorIds.length === 0) {
      return [];
    }

    const pairs = await prisma.classroom.groupBy({
      by: ["tutorId", "studentId"],
      where: { tutorId: { in: tutorIds } },
    });

    const counts = new Map<string, number>();
    for (const { tutorId } of pairs) {
      counts.set(tutorId, (counts.get(tutorId) ?? 0) + 1);
    }

    return [...counts].map(([tutorId, studentCount]) => ({ tutorId, studentCount }));
  },
};
