import { afterEach, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { reviewRepository } from "../src/repository/review.repository.js";
import { tutorRepository } from "../src/repository/tutor.repository.js";
import { tutorService, type TutorListQuery } from "../src/service/tutor.service.js";

function tutorRow(id: string, name: string | null, hourlyRate: string | null = "500") {
  return {
    id,
    name,
    profileUrl: null,
    bio: null,
    hourlyRate: hourlyRate === null ? null : new Prisma.Decimal(hourlyRate),
    tutorSubjects: [{ subject: { id: "subject-1", name: "Math" } }],
  };
}

function reviewRow(id: string) {
  return {
    id,
    rating: 5,
    comment: null,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    student: { name: "Student", profileUrl: null },
  };
}

function mockDetail({
  tutor = tutorRow("tutor-1", "Tutor") as ReturnType<typeof tutorRow> | null,
  ratings = [] as { tutorId: string; averageRating: number | null; reviewCount: number }[],
  reviews = [] as ReturnType<typeof reviewRow>[],
} = {}) {
  jest.spyOn(tutorRepository, "findActiveById").mockResolvedValue(tutor as never);
  jest.spyOn(tutorRepository, "findRatings").mockResolvedValue(ratings);
  jest
    .spyOn(tutorRepository, "findPopularity")
    .mockResolvedValue([{ tutorId: "tutor-1", studentCount: 3 }]);
  return jest.spyOn(reviewRepository, "findByTutor").mockResolvedValue(reviews);
}

/** Lists the given tutors and returns their ids in the order the service ranked them. */
async function rankedIds(
  tutors: ReturnType<typeof tutorRow>[],
  ratings: Record<string, number>,
  query: TutorListQuery = {},
  students: Record<string, number> = {}
) {
  jest.spyOn(tutorRepository, "findActive").mockResolvedValue(tutors as never);
  jest.spyOn(tutorRepository, "findRatings").mockResolvedValue(
    Object.entries(ratings).map(([tutorId, averageRating]) => ({
      tutorId,
      averageRating,
      reviewCount: 1,
    }))
  );
  jest
    .spyOn(tutorRepository, "findPopularity")
    .mockResolvedValue(
      Object.entries(students).map(([tutorId, studentCount]) => ({ tutorId, studentCount }))
    );
  const items = await tutorService.listTutors(query);
  return items.map((item) => item.id);
}

afterEach(() => {
  jest.restoreAllMocks();
});

test("TS-01 getTutor reports an unknown tutor as 404 without loading reviews", async () => {
  const findByTutor = mockDetail({ tutor: null });

  await expect(tutorService.getTutor("tutor-1")).rejects.toMatchObject({
    statusCode: 404,
    message: "Tutor not found",
  });
  expect(findByTutor).not.toHaveBeenCalled();
});

test("TS-02 getTutor returns the rating rounded to one decimal, the price and reviews", async () => {
  mockDetail({
    ratings: [{ tutorId: "tutor-1", averageRating: 4.84, reviewCount: 1 }],
    reviews: [reviewRow("review-1")],
  });

  const tutor = await tutorService.getTutor("tutor-1");

  expect(tutor.rating).toBe(4.8);
  expect(tutor.hourlyRate).toBe(500);
  expect(tutor.studentCount).toBe(3);
  expect(tutor.subjects).toEqual([{ id: "subject-1", name: "Math" }]);
  expect(tutor.reviews).toEqual([
    {
      id: "review-1",
      rating: 5,
      comment: null,
      createdAt: "2026-01-02T03:04:05.000Z",
      student: { name: "Student", profileUrl: null },
    },
  ]);
});

test("TS-03 getTutor shows a tutor without reviews as unrated, not zero", async () => {
  mockDetail();

  const tutor = await tutorService.getTutor("tutor-1");

  expect(tutor.rating).toBeNull();
  expect(tutor.reviewCount).toBe(0);
  expect(tutor.reviews).toEqual([]);
});

test("TS-04 listTutors ranks by the unrounded rating and puts unrated tutors last", async () => {
  const ids = await rankedIds(
    // Unrated sits mid-list so the sort compares it on both the left and right side.
    [tutorRow("high", "A"), tutorRow("unrated", "B"), tutorRow("low", "C")],
    { low: 4.76, high: 4.84 }
  );

  expect(ids).toEqual(["high", "low", "unrated"]);
});

test("TS-05 listTutors keeps unrated tutors last in ascending order too", async () => {
  const ids = await rankedIds(
    [tutorRow("high", "A"), tutorRow("unrated", "B"), tutorRow("low", "C")],
    { low: 2, high: 5 },
    { sortBy: "rating", order: "asc" }
  );

  expect(ids).toEqual(["low", "high", "unrated"]);
});

test("TS-06 listTutors breaks an equal rating by name", async () => {
  const ids = await rankedIds([tutorRow("second", "Ben"), tutorRow("first", "Amy")], {
    first: 4,
    second: 4,
  });

  expect(ids).toEqual(["first", "second"]);
});

test("TS-07 listTutors sorts by price cheapest first, with no price last", async () => {
  const ids = await rankedIds(
    [
      tutorRow("none", "A", null),
      tutorRow("expensive", "B", "900"),
      tutorRow("cheap", "C", "100.50"),
    ],
    {},
    { sortBy: "price" }
  );

  expect(ids).toEqual(["cheap", "expensive", "none"]);
});

test("TS-08 listTutors sorts by popularity, most students first", async () => {
  const ids = await rankedIds(
    [tutorRow("few", "A"), tutorRow("many", "B")],
    {},
    { sortBy: "popularity" },
    { few: 1, many: 9 }
  );

  expect(ids).toEqual(["many", "few"]);
});
