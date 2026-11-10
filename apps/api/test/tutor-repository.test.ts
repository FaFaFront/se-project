import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { tutorRepository } from "../src/repository/tutor.repository.js";
import { fakePrisma, ID, restorePrisma } from "./helpers.js";

type Where = Record<string, unknown>;

function fakeUsers() {
  const findMany = jest.fn(async (_args: { where: Where }) => []);
  const findFirst = jest.fn(async (_args: { where: Where }) => null);
  fakePrisma({ user: { findMany, findFirst } });
  return { findMany, findFirst };
}

afterEach(() => {
  jest.restoreAllMocks();
  restorePrisma();
});

describe("tutorRepository.findActive", () => {
  const publicOnly = { role: "tutor", accountStatus: "ACTIVE", profileComplete: true };

  test("TP-01 with no filter lists only active tutors with a completed profile", async () => {
    const { findMany } = fakeUsers();

    await tutorRepository.findActive({});

    expect(findMany.mock.calls[0][0].where).toEqual(publicOnly);
  });

  test("TP-02 every filter is combined", async () => {
    const { findMany } = fakeUsers();

    await tutorRepository.findActive({
      search: "amy",
      subjectId: ID.subject,
      minPrice: 100,
      maxPrice: 500,
    });

    const where = findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      ...publicOnly,
      name: { contains: "amy", mode: "insensitive" },
      tutorSubjects: { some: { subjectId: ID.subject } },
    });
    const rate = where.hourlyRate as { gte: Prisma.Decimal; lte: Prisma.Decimal };
    expect([String(rate.gte), String(rate.lte)]).toEqual(["100", "500"]);
  });

  test("TP-03 a minimum of 0 is still applied (not treated as 'no filter')", async () => {
    const { findMany } = fakeUsers();

    await tutorRepository.findActive({ minPrice: 0 });

    const rate = findMany.mock.calls[0][0].where.hourlyRate as Record<string, unknown>;
    expect(String(rate.gte)).toBe("0");
    expect(rate).not.toHaveProperty("lte");
  });

  test("TP-04 findActiveById hides inactive or incomplete tutors", async () => {
    const { findFirst } = fakeUsers();

    await tutorRepository.findActiveById(ID.tutor);

    expect(findFirst.mock.calls[0][0].where).toEqual({ id: ID.tutor, ...publicOnly });
  });
});

describe("tutorRepository ratings and popularity", () => {
  test("TP-05 ratings map Prisma's groupBy output", async () => {
    const groupBy = jest.fn(async () => [
      { tutorId: ID.tutor, _avg: { rating: 4.5 }, _count: { _all: 2 } },
    ]);
    fakePrisma({ review: { groupBy } });

    expect(await tutorRepository.findRatings([ID.tutor])).toEqual([
      { tutorId: ID.tutor, averageRating: 4.5, reviewCount: 2 },
    ]);
  });

  test("TP-06 popularity converts Postgres bigint counts to numbers", async () => {
    fakePrisma({ $queryRaw: jest.fn(async () => [{ tutorId: ID.tutor, studentCount: 7n }]) });

    expect(await tutorRepository.findPopularity([ID.tutor])).toEqual([
      { tutorId: ID.tutor, studentCount: 7 },
    ]);
  });

  test("TP-07 an empty tutor list skips both queries", async () => {
    const groupBy = jest.fn();
    const queryRaw = jest.fn();
    fakePrisma({ review: { groupBy }, $queryRaw: queryRaw });

    expect(await tutorRepository.findRatings([])).toEqual([]);
    expect(await tutorRepository.findPopularity([])).toEqual([]);
    expect(groupBy).not.toHaveBeenCalled();
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
