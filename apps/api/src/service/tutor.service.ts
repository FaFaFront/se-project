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

/** A list item plus the unrounded average, so 4.84 still outranks 4.76 though both show "4.8". */
type RankedTutor = { item: TutorListItem; averageRating: number | null };

const SORT_VALUE: Record<TutorSortBy, (tutor: RankedTutor) => number | null> = {
  rating: (tutor) => tutor.averageRating,
  price: (tutor) => tutor.item.hourlyRate,
  popularity: (tutor) => tutor.item.studentCount,
};

function compareTutors(sortBy: TutorSortBy, order: SortOrder) {
  const valueOf = SORT_VALUE[sortBy];
  const direction = order === "asc" ? 1 : -1;

  return (a: RankedTutor, b: RankedTutor) => {
    const left = valueOf(a);
    const right = valueOf(b);

    // Missing values (no reviews, no rate) always sink to the bottom.
    if (left !== right) {
      if (left === null) return 1;
      if (right === null) return -1;
      return (left - right) * direction;
    }
    return (a.item.name ?? "").localeCompare(b.item.name ?? "");
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

    const ranked: RankedTutor[] = tutors.map((tutor) => {
      const rating = ratingByTutor.get(tutor.id);
      const averageRating = rating?.averageRating ?? null;
      const item: TutorListItem = {
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
      return { item, averageRating };
    });

    const effectiveSort = sortBy ?? "rating";
    return ranked
      .sort(compareTutors(effectiveSort, order ?? DEFAULT_ORDER[effectiveSort]))
      .map(({ item }) => item);
  },
};
