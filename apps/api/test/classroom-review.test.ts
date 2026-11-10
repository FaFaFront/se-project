import { afterEach, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ConflictError, UnauthorizedError } from "../src/common/errors/app-error.js";
import type { AuthRequest } from "../src/common/middleware/auth.middleware.js";
import { classroomController } from "../src/controller/classroom.controller.js";
import { classroomRepository } from "../src/repository/classroom.repository.js";
import { reviewRepository } from "../src/repository/review.repository.js";
import { classroomService } from "../src/service/classroom.service.js";

const CLASSROOM_ID = "11111111-1111-4111-8111-111111111111";
const STUDENT_ID = "22222222-2222-4222-8222-222222222222";
const TUTOR_ID = "33333333-3333-4333-8333-333333333333";

const completedClassroom = { studentId: STUDENT_ID, tutorId: TUTOR_ID, status: "completed" };
const savedReview = {
  id: "review-1",
  rating: 5,
  comment: "Great",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

function mockFindClassroom(classroom: object | null) {
  return jest.spyOn(classroomRepository, "findById").mockResolvedValue(classroom as never);
}

function mockCreateReview() {
  return jest.spyOn(reviewRepository, "create").mockResolvedValue(savedReview);
}

afterEach(() => {
  jest.restoreAllMocks();
});

test("CS-01 createReview saves against the classroom's tutor and returns the mapped review", async () => {
  mockFindClassroom(completedClassroom);
  const create = mockCreateReview();

  const result = await classroomService.createReview(CLASSROOM_ID, STUDENT_ID, {
    rating: 5,
    comment: "Great",
  });

  expect(create).toHaveBeenCalledWith({
    classroomId: CLASSROOM_ID,
    studentId: STUDENT_ID,
    tutorId: TUTOR_ID,
    rating: 5,
    comment: "Great",
  });
  expect(result).toEqual({
    id: "review-1",
    rating: 5,
    comment: "Great",
    createdAt: "2026-01-02T03:04:05.000Z",
  });
});

test("CS-02 createReview stores a missing comment as null", async () => {
  mockFindClassroom(completedClassroom);
  const create = mockCreateReview();

  await classroomService.createReview(CLASSROOM_ID, STUDENT_ID, { rating: 3 });

  expect(create).toHaveBeenCalledWith(expect.objectContaining({ comment: null }));
});

test("CS-03 createReview reports a missing classroom as 404", async () => {
  mockFindClassroom(null);
  const create = mockCreateReview();

  await expect(
    classroomService.createReview(CLASSROOM_ID, STUDENT_ID, { rating: 5 })
  ).rejects.toMatchObject({ statusCode: 404, message: "Classroom not found" });
  expect(create).not.toHaveBeenCalled();
});

test("CS-04 createReview hides another student's classroom behind the same 404", async () => {
  mockFindClassroom({ ...completedClassroom, studentId: "someone-else" });
  const create = mockCreateReview();

  await expect(
    classroomService.createReview(CLASSROOM_ID, STUDENT_ID, { rating: 5 })
  ).rejects.toMatchObject({ statusCode: 404, message: "Classroom not found" });
  expect(create).not.toHaveBeenCalled();
});

test("CS-05 createReview refuses a classroom that is still active with 403", async () => {
  mockFindClassroom({ ...completedClassroom, status: "active" });
  const create = mockCreateReview();

  await expect(
    classroomService.createReview(CLASSROOM_ID, STUDENT_ID, { rating: 5 })
  ).rejects.toMatchObject({
    statusCode: 403,
    message: "Only completed classrooms can be reviewed",
  });
  expect(create).not.toHaveBeenCalled();
});

test("CS-06 createReview turns the unique-constraint failure into a 409", async () => {
  mockFindClassroom(completedClassroom);
  jest.spyOn(reviewRepository, "create").mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("duplicate", {
      code: "P2002",
      clientVersion: "test",
    })
  );

  await expect(
    classroomService.createReview(CLASSROOM_ID, STUDENT_ID, { rating: 5 })
  ).rejects.toMatchObject({
    statusCode: 409,
    message: "This classroom has already been reviewed",
  });
});

test("CS-07 createReview rethrows any other database failure unchanged", async () => {
  const failure = new Error("database is down");
  mockFindClassroom(completedClassroom);
  jest.spyOn(reviewRepository, "create").mockRejectedValue(failure);

  await expect(classroomService.createReview(CLASSROOM_ID, STUDENT_ID, { rating: 5 })).rejects.toBe(
    failure
  );
});

/** Runs the controller with a stubbed service and reports everything it did. */
async function submitReview({
  body,
  classroomId = CLASSROOM_ID,
  user = { id: STUDENT_ID, role: "student" },
  serviceFailure,
}: {
  body?: unknown;
  classroomId?: string;
  user?: AuthRequest["user"] | null;
  serviceFailure?: Error;
}) {
  const createReview = jest.spyOn(classroomService, "createReview");
  if (serviceFailure) createReview.mockRejectedValue(serviceFailure);
  else createReview.mockResolvedValue({ id: "review-1" } as never);

  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  const next = jest.fn();

  await classroomController.createReview(
    { user, params: { classroomId }, body } as unknown as AuthRequest,
    res as never,
    next
  );

  return { createReview, res, error: next.mock.calls[0]?.[0] as ZodError | undefined };
}

test("CC-01 POST review answers 201 and takes the student from the token", async () => {
  const { createReview, res, error } = await submitReview({ body: { rating: 4 } });

  expect(error).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({
    success: true,
    message: "Review submitted successfully",
    data: { id: "review-1" },
  });
  expect(createReview).toHaveBeenCalledWith(CLASSROOM_ID, STUDENT_ID, { rating: 4 });
});

test.each([1, 5])("CC-02 POST review accepts the boundary rating %i", async (rating) => {
  const { res, error } = await submitReview({ body: { rating } });

  expect(error).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(201);
});

test.each([
  ["rating 0", { rating: 0 }, "Rating must be between 1 and 5"],
  ["rating 6", { rating: 6 }, "Rating must be between 1 and 5"],
  ["rating 3.5", { rating: 3.5 }, "Rating must be a whole number"],
  ["rating 5 sent as text", { rating: "5" }, "Rating must be a number"],
  ["no rating", {}, "Rating is required"],
  ["comment that is not text", { rating: 5, comment: 7 }, "Comment must be text"],
  [
    "comment over 1000 characters",
    { rating: 5, comment: "a".repeat(1001) },
    "Comment must be at most 1000 characters",
  ],
])("CC-03 POST review rejects %s", async (_label, body, message) => {
  const { createReview, res, error } = await submitReview({ body });

  expect(error).toBeInstanceOf(ZodError);
  expect(error?.issues[0].message).toBe(message);
  expect(createReview).not.toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});

test("CC-04 POST review rejects a tutorId smuggled into the body", async () => {
  const { createReview, error } = await submitReview({ body: { rating: 5, tutorId: TUTOR_ID } });

  expect(error).toBeInstanceOf(ZodError);
  expect(createReview).not.toHaveBeenCalled();
});

test.each([
  ["trims surrounding spaces", "  Great  ", "Great"],
  ["treats a blank comment as none", "   ", undefined],
  ["treats a null comment as none", null, undefined],
  ["counts the limit after trimming", ` ${"a".repeat(1000)} `, "a".repeat(1000)],
])("CC-05 POST review %s", async (_label, comment, expected) => {
  const { createReview, error } = await submitReview({ body: { rating: 5, comment } });

  expect(error).toBeUndefined();
  expect(createReview).toHaveBeenCalledWith(CLASSROOM_ID, STUDENT_ID, {
    rating: 5,
    comment: expected,
  });
});

test("CC-06 POST review rejects a classroom id that is not a UUID", async () => {
  const { createReview, error } = await submitReview({
    classroomId: "not-a-uuid",
    body: { rating: 5 },
  });

  expect(error).toBeInstanceOf(ZodError);
  expect(error?.issues[0].message).toBe("Classroom ID must be a valid UUID");
  expect(createReview).not.toHaveBeenCalled();
});

test("CC-07 POST review without an authenticated user fails with 401", async () => {
  const { createReview, error } = await submitReview({ user: null, body: { rating: 5 } });

  expect(error).toBeInstanceOf(UnauthorizedError);
  expect(createReview).not.toHaveBeenCalled();
});

test("CC-08 POST review hands service errors to the error handler", async () => {
  const failure = new ConflictError("This classroom has already been reviewed");
  const { res, error } = await submitReview({ body: { rating: 5 }, serviceFailure: failure });

  expect(error).toBe(failure);
  expect(res.status).not.toHaveBeenCalled();
});
