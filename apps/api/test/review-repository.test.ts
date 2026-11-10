import { afterEach, expect, jest, test } from "@jest/globals";
import { prisma } from "../src/config/prisma.js";
import { reviewRepository, reviewSelect } from "../src/repository/review.repository.js";

const realDelegate = prisma.review;

// Prisma's delegates are proxies that jest.spyOn can't patch, so the whole delegate is swapped.
function fakeReviewDelegate(delegate: Record<string, unknown>) {
  Object.defineProperty(prisma, "review", { value: delegate, configurable: true });
}

afterEach(() => {
  Object.defineProperty(prisma, "review", { value: realDelegate, configurable: true });
});

test("RR-01 findByTutor loads only that tutor's reviews, newest first, breaking ties by id", async () => {
  const findMany = jest.fn(async (_query: unknown) => []);
  fakeReviewDelegate({ findMany });

  await reviewRepository.findByTutor("tutor-1");

  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { tutorId: "tutor-1" },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    })
  );
});

test("RR-02 findByTutor exposes only the reviewer's name and photo", async () => {
  const findMany = jest.fn(async (_query: unknown) => []);
  fakeReviewDelegate({ findMany });

  await reviewRepository.findByTutor("tutor-1");

  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      select: { ...reviewSelect, student: { select: { name: true, profileUrl: true } } },
    })
  );
});

test("RR-03 create stores the given data and returns the saved row", async () => {
  const row = { id: "review-1" };
  const create = jest.fn(async (_query: unknown) => row);
  fakeReviewDelegate({ create });
  const data = {
    classroomId: "classroom-1",
    studentId: "student-1",
    tutorId: "tutor-1",
    rating: 4,
    comment: null,
  };

  const result = await reviewRepository.create(data);

  expect(result).toBe(row);
  expect(create).toHaveBeenCalledWith({ data, select: reviewSelect });
});
