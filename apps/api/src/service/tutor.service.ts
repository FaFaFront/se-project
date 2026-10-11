import { tutorRepository, type TutorListFilter } from "../repository/tutor.repository.js";

export type TutorSortBy = "rating" | "price" | "popularity";
export type SortOrder = "asc" | "desc";

export type TutorListQuery = TutorListFilter & {
  sortBy?: TutorSortBy;
  order?: SortOrder;
};

export type TutorListItem = {
  id: string;
  name: string | null;
  profileUrl: string | null;
  bio: string | null;
  hourlyRate: number | null;
  subjects: { id: string; name: string }[];
  /** Average review score out of 5, rounded to one decimal; null when unreviewed. */
  rating: number | null;
  reviewCount: number;
  /** Distinct students who have had a classroom with this tutor. */
  studentCount: number;
};

const DEFAULT_ORDER: Record<TutorSortBy, SortOrder> = {
  rating: "desc",
  price: "asc",
  popularity: "desc",
};

const SORT_VALUE: Record<TutorSortBy, (tutor: TutorListItem) => number | null> = {
  rating: (tutor) => tutor.rating,
  price: (tutor) => tutor.hourlyRate,
  popularity: (tutor) => tutor.studentCount,
};

function compareTutors(sortBy: TutorSortBy, order: SortOrder) {
  const valueOf = SORT_VALUE[sortBy];
  const direction = order === "asc" ? 1 : -1;

  return (a: TutorListItem, b: TutorListItem) => {
    const left = valueOf(a);
    const right = valueOf(b);

    // Missing values (no reviews, no rate) always sink to the bottom.
    if (left !== right) {
      if (left === null) return 1;
      if (right === null) return -1;
      return (left - right) * direction;
    }
    return (a.name ?? "").localeCompare(b.name ?? "");
  };
}

export const tutorService = {
  async listTutors(query: TutorListQuery): Promise<TutorListItem[]> {
    const { sortBy, order, ...filter } = query;

    const tutors = await tutorRepository.findActive(filter);
    const tutorIds = tutors.map((tutor) => tutor.id);
    const [ratings, popularity] = await Promise.all([
      tutorRepository.findRatings(tutorIds),
      tutorRepository.findPopularity(tutorIds),
    ]);

    const ratingByTutor = new Map(ratings.map((row) => [row.tutorId, row]));
    const studentsByTutor = new Map(popularity.map((row) => [row.tutorId, row.studentCount]));

    const items: TutorListItem[] = tutors.map((tutor) => {
      const rating = ratingByTutor.get(tutor.id);
      const averageRating = rating?.averageRating ?? null;
      return {
        id: tutor.id,
        name: tutor.name,
        profileUrl: tutor.profileUrl,
        bio: tutor.bio,
        hourlyRate: tutor.hourlyRate === null ? null : Number(tutor.hourlyRate),
        subjects: tutor.tutorSubjects.map((tutorSubject) => tutorSubject.subject),
        rating: averageRating === null ? null : Math.round(averageRating * 10) / 10,
        reviewCount: rating?.reviewCount ?? 0,
        studentCount: studentsByTutor.get(tutor.id) ?? 0,
      };
    });

    const effectiveSort = sortBy ?? "rating";
    return items.sort(compareTutors(effectiveSort, order ?? DEFAULT_ORDER[effectiveSort]));
  },
};
