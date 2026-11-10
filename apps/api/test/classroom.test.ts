import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { UnauthorizedError } from "../src/common/errors/app-error.js";
import { classroomController } from "../src/controller/classroom.controller.js";
import { classroomRepository } from "../src/repository/classroom.repository.js";
import { conversationRepository } from "../src/repository/conversation.repository.js";
import { tutorRepository } from "../src/repository/tutor.repository.js";
import { classroomService } from "../src/service/classroom.service.js";
import { callController, fakeTransaction, ID, restorePrisma } from "./helpers.js";

const created = new Date("2026-03-01T10:00:00.000Z");
const tutorPerson = { id: ID.tutor, name: "Tutor", profileUrl: null };
const studentPerson = { id: ID.student, name: "Student", profileUrl: "https://x/s.png" };
const subject = { id: ID.subject, name: "Math" };

function detailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.classroom,
    tutorId: ID.tutor,
    studentId: ID.student,
    subject,
    pricePerHour: new Prisma.Decimal("350.00"),
    status: "active",
    createdAt: created,
    tutor: tutorPerson,
    student: studentPerson,
    sessions: [],
    review: null,
    ...overrides,
  };
}

const ownClassroom = {
  id: ID.classroom,
  tutorId: ID.tutor,
  studentId: ID.student,
  status: "active",
};

function conversation(otherRole: string) {
  return {
    id: ID.conversation,
    participantAId: ID.tutor,
    participantBId: ID.student,
    participantA: { id: ID.tutor, role: "tutor" },
    participantB: { id: ID.student, role: otherRole },
  };
}

afterEach(() => {
  jest.restoreAllMocks();
  restorePrisma();
});

describe("classroomService.listClassroomsForUser", () => {
  test("CL-01 a tutor sees the student as the participant", async () => {
    const byTutor = jest.spyOn(classroomRepository, "findByTutor").mockResolvedValue([
      {
        id: ID.classroom,
        student: studentPerson,
        subject,
        pricePerHour: new Prisma.Decimal(350),
        status: "active",
        createdAt: created,
      },
    ] as never);
    const byStudent = jest.spyOn(classroomRepository, "findByStudent");

    const list = await classroomService.listClassroomsForUser(ID.tutor, "tutor", {
      status: "active",
    });

    expect(byTutor).toHaveBeenCalledWith(ID.tutor, { status: "active" });
    expect(byStudent).not.toHaveBeenCalled();
    expect(list).toEqual([
      {
        id: ID.classroom,
        participant: studentPerson,
        subject,
        pricePerHour: 350,
        status: "active",
        createdAt: created.toISOString(),
      },
    ]);
  });

  test("CL-02 a student sees the tutor as the participant", async () => {
    jest.spyOn(classroomRepository, "findByStudent").mockResolvedValue([
      {
        id: ID.classroom,
        tutor: tutorPerson,
        subject,
        pricePerHour: new Prisma.Decimal(1),
        status: "completed",
        createdAt: created,
      },
    ] as never);

    const [item] = await classroomService.listClassroomsForUser(ID.student, "student", {});

    expect(item.participant).toEqual(tutorPerson);
  });
});

describe("classroomService.createClassroom", () => {
  function mockCreate() {
    return jest.spyOn(classroomRepository, "create").mockResolvedValue({
      id: ID.classroom,
      tutorId: ID.tutor,
      studentId: ID.student,
      subjectId: ID.subject,
      pricePerHour: new Prisma.Decimal("400"),
      status: "active",
      createdAt: created,
    } as never);
  }

  test("CL-03 creates with the given price for the conversation's student", async () => {
    jest
      .spyOn(conversationRepository, "findParticipantsForParticipant")
      .mockResolvedValue(conversation("student") as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue({} as never);
    const create = mockCreate();

    const result = await classroomService.createClassroom(ID.tutor, {
      conversationId: ID.conversation,
      subjectId: ID.subject,
      pricePerHour: 400,
    });

    expect(create.mock.calls[0][0]).toMatchObject({ tutorId: ID.tutor, studentId: ID.student });
    expect(String(create.mock.calls[0][0].pricePerHour)).toBe("400");
    expect(result).toMatchObject({ pricePerHour: 400, createdAt: created.toISOString() });
  });

  test("CL-04 without a price uses the tutor's default hourly rate", async () => {
    jest
      .spyOn(conversationRepository, "findParticipantsForParticipant")
      .mockResolvedValue(conversation("student") as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue({} as never);
    jest
      .spyOn(tutorRepository, "findHourlyRate")
      .mockResolvedValue({ hourlyRate: new Prisma.Decimal("275.50") } as never);
    const create = mockCreate();

    await classroomService.createClassroom(ID.tutor, {
      conversationId: ID.conversation,
      subjectId: ID.subject,
    });

    expect(String(create.mock.calls[0][0].pricePerHour)).toBe("275.5");
  });

  test("CL-05 finds the student whichever side of the conversation they are on", async () => {
    jest.spyOn(conversationRepository, "findParticipantsForParticipant").mockResolvedValue({
      ...conversation("student"),
      participantAId: ID.student,
      participantA: { id: ID.student, role: "student" },
      participantB: { id: ID.tutor, role: "tutor" },
    } as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue({} as never);
    const create = mockCreate();

    await classroomService.createClassroom(ID.tutor, {
      conversationId: ID.conversation,
      subjectId: ID.subject,
      pricePerHour: 1,
    });

    expect(create.mock.calls[0][0].studentId).toBe(ID.student);
  });

  test.each([
    ["the conversation is not the tutor's", null, {}, null, 404, "Conversation not found"],
    ["the other person is a tutor", conversation("tutor"), {}, null, 400, "not a student"],
    ["the subject is not assigned", conversation("student"), null, null, 400, "not assigned"],
    [
      "no price and no default rate",
      conversation("student"),
      {},
      { hourlyRate: null },
      400,
      "no default hourly rate",
    ],
    [
      "no price and a zero rate",
      conversation("student"),
      {},
      { hourlyRate: new Prisma.Decimal(0) },
      400,
      "no default hourly rate",
    ],
  ])("CL-06 refuses when %s", async (_label, conv, assignment, rate, statusCode, message) => {
    jest
      .spyOn(conversationRepository, "findParticipantsForParticipant")
      .mockResolvedValue(conv as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue(assignment as never);
    jest.spyOn(tutorRepository, "findHourlyRate").mockResolvedValue(rate as never);
    const create = mockCreate();

    await expect(
      classroomService.createClassroom(ID.tutor, {
        conversationId: ID.conversation,
        subjectId: ID.subject,
      })
    ).rejects.toMatchObject({ statusCode, message: expect.stringContaining(message) });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("classroomService.getClassroomDetail", () => {
  test("CL-07 tutor view shows the student and serializes sessions and review", async () => {
    jest.spyOn(classroomRepository, "findDetailById").mockResolvedValue(
      detailRow({
        review: { id: "r1", rating: 5, comment: null, createdAt: created },
        sessions: [
          {
            id: ID.session,
            classroomId: ID.classroom,
            scheduledAt: created,
            durationMinutes: 90,
            status: "scheduled",
            meetLink: "https://meet",
            meetSpaceName: null,
            startedAt: null,
            endedAt: null,
            amountCharged: null,
            tutorJoinedAt: null,
            studentJoinedAt: null,
            attendanceTrackingEnabled: true,
          },
        ],
      }) as never
    );

    const detail = await classroomService.getClassroomDetail(ID.classroom, ID.tutor);

    expect(detail).toMatchObject({
      viewerRole: "tutor",
      participant: studentPerson,
      pricePerHour: 350,
      review: { createdAt: created.toISOString() },
      sessions: [{ durationHours: 1.5, scheduledAt: created.toISOString() }],
    });
  });

  test("CL-08 student view shows the tutor", async () => {
    jest.spyOn(classroomRepository, "findDetailById").mockResolvedValue(detailRow() as never);

    const detail = await classroomService.getClassroomDetail(ID.classroom, ID.student);

    expect(detail).toMatchObject({ viewerRole: "student", participant: tutorPerson, review: null });
  });

  test.each([
    ["a missing classroom", null],
    ["an outsider", detailRow()],
  ])("CL-09 %s gets the same 404", async (_label, row) => {
    jest.spyOn(classroomRepository, "findDetailById").mockResolvedValue(row as never);

    await expect(classroomService.getClassroomDetail(ID.classroom, ID.other)).rejects.toMatchObject(
      {
        statusCode: 404,
        message: "Classroom not found",
      }
    );
  });
});

describe("classroomService.updateClassroom", () => {
  const input = { subjectId: ID.subject, pricePerHour: 500 };

  test("CL-10 updates subject and price and returns the fresh detail", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(ownClassroom as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue({} as never);
    const update = jest
      .spyOn(classroomRepository, "updateActiveDetails")
      .mockResolvedValue({ count: 1 });
    jest
      .spyOn(classroomRepository, "findDetailById")
      .mockResolvedValue(detailRow({ pricePerHour: new Prisma.Decimal(500) }) as never);

    const result = await classroomService.updateClassroom(ID.classroom, ID.tutor, input);

    expect(update.mock.calls[0][1]).toBe(ID.tutor);
    expect(String(update.mock.calls[0][2].pricePerHour)).toBe("500");
    expect(result).toMatchObject({ pricePerHour: 500, viewerRole: "tutor" });
  });

  test.each([
    ["another tutor's classroom", { ...ownClassroom, tutorId: ID.other }, {}, 404],
    ["a completed classroom", { ...ownClassroom, status: "completed" }, {}, 409],
    ["an unassigned subject", ownClassroom, null, 400],
  ])("CL-11 refuses %s", async (_label, classroom, assignment, statusCode) => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(classroom as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue(assignment as never);
    const update = jest.spyOn(classroomRepository, "updateActiveDetails");

    await expect(
      classroomService.updateClassroom(ID.classroom, ID.tutor, input)
    ).rejects.toMatchObject({ statusCode });
    expect(update).not.toHaveBeenCalled();
  });

  test("CL-12 a classroom deactivated during the update (count 0) is 409", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(ownClassroom as never);
    jest.spyOn(tutorRepository, "findSubjectAssignment").mockResolvedValue({} as never);
    jest.spyOn(classroomRepository, "updateActiveDetails").mockResolvedValue({ count: 0 });

    await expect(
      classroomService.updateClassroom(ID.classroom, ID.tutor, input)
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("reload") });
  });
});

describe("classroomService.deactivate", () => {
  test("CL-13 tutor deactivates their classroom", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(ownClassroom as never);
    const deactivate = jest
      .spyOn(classroomRepository, "deactivateWithSessions")
      .mockResolvedValue(undefined);

    expect(await classroomService.deactivate(ID.classroom, ID.tutor, "tutor")).toEqual({
      id: ID.classroom,
      status: "completed",
    });
    expect(deactivate).toHaveBeenCalledWith(ID.classroom, ID.tutor);
  });

  test("CL-14 a student is 403 and another tutor is 404", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(ownClassroom as never);
    const deactivate = jest.spyOn(classroomRepository, "deactivateWithSessions");

    await expect(
      classroomService.deactivate(ID.classroom, ID.student, "student")
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      classroomService.deactivate(ID.classroom, ID.other, "tutor")
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(deactivate).not.toHaveBeenCalled();
  });
});

describe("classroomRepository.deactivateWithSessions", () => {
  function fake(classroom: object | null, unsettled = 0) {
    const updateMany = jest.fn(async (_args: object) => ({ count: 2 }));
    const update = jest.fn(async (_args: object) => ({}));
    fakeTransaction({
      classroom: { findUnique: jest.fn(async () => classroom), update },
      meetSession: { count: jest.fn(async () => unsettled), updateMany },
    });
    return { updateMany, update };
  }

  test("CL-15 cancels scheduled sessions and completes the classroom", async () => {
    const { updateMany, update } = fake(ownClassroom);

    await classroomRepository.deactivateWithSessions(ID.classroom, ID.tutor);

    expect(updateMany).toHaveBeenCalledWith({
      where: { classroomId: ID.classroom, status: "scheduled" },
      data: { status: "cancelled" },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: ID.classroom },
      data: { status: "completed" },
    });
  });

  test("CL-16 an already completed classroom is left alone", async () => {
    const { updateMany, update } = fake({ ...ownClassroom, status: "completed" });

    await classroomRepository.deactivateWithSessions(ID.classroom, ID.tutor);

    expect(updateMany).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  test("CL-17 an ongoing or payment-pending session blocks deactivation", async () => {
    const { update } = fake(ownClassroom, 1);

    await expect(
      classroomRepository.deactivateWithSessions(ID.classroom, ID.tutor)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(update).not.toHaveBeenCalled();
  });

  test("CL-18 another tutor's classroom is 404", async () => {
    fake({ ...ownClassroom, tutorId: ID.other });

    await expect(
      classroomRepository.deactivateWithSessions(ID.classroom, ID.tutor)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("classroomController", () => {
  const tutor = { id: ID.tutor, role: "tutor" };

  test.each([
    ["listClassrooms", classroomController.listClassrooms],
    ["createClassroom", classroomController.createClassroom],
    ["getClassroomDetail", classroomController.getClassroomDetail],
    ["updateClassroom", classroomController.updateClassroom],
    ["deactivate", classroomController.deactivate],
  ])("CT-01 %s without a user is 401", async (_label, handler) => {
    const { error } = await callController(handler, {});

    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  test.each([
    [{ status: "all", search: "  ", subjectId: "" }, {}],
    [{ status: "", search: " math " }, { search: "math" }],
    [
      { status: "completed", subjectId: ID.subject },
      { status: "completed", subjectId: ID.subject },
    ],
  ])("CT-02 listClassrooms normalizes query %j", async (query, filter) => {
    const list = jest.spyOn(classroomService, "listClassroomsForUser").mockResolvedValue([]);

    const { res } = await callController(classroomController.listClassrooms, {
      user: tutor,
      query,
    });

    expect(list.mock.calls[0].slice(0, 2)).toEqual([ID.tutor, "tutor"]);
    expect(list.mock.calls[0][2]).toEqual(filter);
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  test("CT-03 listClassrooms treats any non-tutor role as student", async () => {
    const list = jest.spyOn(classroomService, "listClassroomsForUser").mockResolvedValue([]);

    await callController(classroomController.listClassrooms, {
      user: { id: ID.user, role: "admin" },
    });

    expect(list.mock.calls[0][1]).toBe("student");
  });

  test.each([{ status: "archived" }, { subjectId: "math" }, { search: "a".repeat(101) }])(
    "CT-04 listClassrooms rejects query %j",
    async (query) => {
      const { error } = await callController(classroomController.listClassrooms, {
        user: tutor,
        query,
      });

      expect(error).toBeInstanceOf(ZodError);
    }
  );

  test("CT-05 createClassroom returns 201", async () => {
    const create = jest.spyOn(classroomService, "createClassroom").mockResolvedValue({} as never);

    const { res } = await callController(classroomController.createClassroom, {
      user: tutor,
      body: { conversationId: ID.conversation, subjectId: ID.subject, pricePerHour: 199.99 },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(create).toHaveBeenCalledWith(
      ID.tutor,
      expect.objectContaining({ pricePerHour: 199.99 })
    );
  });

  test.each([
    ["three decimal places", 10.005, "at most 2 decimal places"],
    ["zero", 0, "positive"],
    ["too large", 100_000_000, "too large"],
    ["text", "100", "must be a number"],
  ])("CT-06 price %s is rejected", async (_label, pricePerHour, message) => {
    const { error } = await callController(classroomController.createClassroom, {
      user: tutor,
      body: { conversationId: ID.conversation, subjectId: ID.subject, pricePerHour },
    });

    expect(error).toBeInstanceOf(ZodError);
    expect(error?.message).toContain(message);
  });

  test("CT-07 updateClassroom rejects extra fields like status or tutorId", async () => {
    const update = jest.spyOn(classroomService, "updateClassroom");

    const { error } = await callController(classroomController.updateClassroom, {
      user: tutor,
      params: { classroomId: ID.classroom },
      body: { subjectId: ID.subject, pricePerHour: 100, status: "completed" },
    });

    expect(error).toBeInstanceOf(ZodError);
    expect(update).not.toHaveBeenCalled();
  });

  test("CT-08 getClassroomDetail rejects a bad id and is never cached when valid", async () => {
    jest.spyOn(classroomService, "getClassroomDetail").mockResolvedValue({} as never);

    const bad = await callController(classroomController.getClassroomDetail, {
      user: tutor,
      params: { classroomId: "x" },
    });
    const good = await callController(classroomController.getClassroomDetail, {
      user: tutor,
      params: { classroomId: ID.classroom },
    });

    expect(bad.error).toBeInstanceOf(ZodError);
    expect(good.res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  test.each([
    ["no body", {}, undefined],
    ["an empty JSON object", { "content-length": "2" }, {}],
  ])("CT-09 deactivate accepts %s", async (_label, headers, body) => {
    jest.spyOn(classroomService, "deactivate").mockResolvedValue({} as never);

    const { res } = await callController(classroomController.deactivate, {
      user: tutor,
      params: { classroomId: ID.classroom },
      headers,
      body,
    });

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("CT-10 deactivate rejects a non-JSON body and a non-empty JSON body", async () => {
    const deactivate = jest.spyOn(classroomService, "deactivate");

    const text = await callController(classroomController.deactivate, {
      user: tutor,
      params: { classroomId: ID.classroom },
      headers: { "content-length": "5" },
      is: () => false,
    });
    const json = await callController(classroomController.deactivate, {
      user: tutor,
      params: { classroomId: ID.classroom },
      headers: { "content-length": "12" },
      body: { force: true },
    });

    expect(text.error?.statusCode).toBe(400);
    expect(json.error).toBeInstanceOf(ZodError);
    expect(deactivate).not.toHaveBeenCalled();
  });
});
