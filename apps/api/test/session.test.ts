import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ZodError } from "zod";
import { UnauthorizedError } from "../src/common/errors/app-error.js";
import { sessionController } from "../src/controller/session.controller.js";
import { classroomRepository } from "../src/repository/classroom.repository.js";
import { sessionRepository } from "../src/repository/session.repository.js";
import { transactionRepository } from "../src/repository/transaction.repository.js";
import { serializeMessage } from "../src/common/utils/message.js";
import { conversationRepository } from "../src/repository/conversation.repository.js";
import { runSessionSettlementTick, sessionService } from "../src/service/session.service.js";
import { callController, fakePrisma, fakeTransaction, ID, restorePrisma } from "./helpers.js";

const NOW = new Date("2026-05-01T10:00:00.000Z");
const HOUR = 3_600_000;

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.session,
    classroomId: ID.classroom,
    scheduledAt: new Date(NOW.getTime() - HOUR / 2),
    durationMinutes: 60,
    status: "scheduled",
    meetLink: "https://meet.jit.si/se-x",
    meetSpaceName: null,
    startedAt: null,
    endedAt: null,
    amountCharged: null,
    tutorJoinedAt: null,
    studentJoinedAt: null,
    attendanceTrackingEnabled: true,
    settlementNotifiedAt: null,
    classroom: { tutorId: ID.tutor, studentId: ID.student },
    ...overrides,
  };
}

const activeClassroom = {
  id: ID.classroom,
  tutorId: ID.tutor,
  studentId: ID.student,
  status: "active",
};
const inTwoHours = () => new Date(Date.now() + 2 * HOUR).toISOString();

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  restorePrisma();
});

describe("sessionService.getSession", () => {
  test.each([
    ["tutor", ID.tutor],
    ["student", ID.student],
  ])("SE-01 the %s can read the session", async (_role, userId) => {
    jest.spyOn(sessionRepository, "findById").mockResolvedValue(sessionRow() as never);

    const session = await sessionService.getSession(ID.session, userId);

    expect(session).toMatchObject({ id: ID.session, durationHours: 1 });
    expect(session).not.toHaveProperty("classroom");
  });

  test.each([
    ["an outsider", sessionRow()],
    ["a missing session", null],
  ])("SE-02 %s gets 404", async (_label, row) => {
    jest.spyOn(sessionRepository, "findById").mockResolvedValue(row as never);

    await expect(sessionService.getSession(ID.session, ID.other)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("sessionService.createSession", () => {
  function mockCreate() {
    return jest.spyOn(sessionRepository, "create").mockResolvedValue(sessionRow() as never);
  }

  test("SE-03 schedules a session with a Jitsi link and a Decimal duration", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(activeClassroom as never);
    const overlap = jest.spyOn(sessionRepository, "hasOverlap").mockResolvedValue(false);
    const create = mockCreate();
    const scheduledAt = inTwoHours();

    await sessionService.createSession(ID.classroom, ID.tutor, { scheduledAt, durationHours: 1.5 });

    const start = new Date(scheduledAt);
    expect(overlap).toHaveBeenCalledWith(
      ID.tutor,
      ID.student,
      start,
      new Date(start.getTime() + 1.5 * HOUR)
    );
    const data = create.mock.calls[0][0];
    expect(data.meetLink).toMatch(/^https:\/\/meet\.jit\.si\/se-[0-9a-f-]{36}$/);
    expect(data.durationMinutes).toBe(90);
  });

  test("SE-12 a 5-minute session starting 2 minutes ahead is allowed", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(activeClassroom as never);
    jest.spyOn(sessionRepository, "hasOverlap").mockResolvedValue(false);
    const create = mockCreate();

    await sessionService.createSession(ID.classroom, ID.tutor, {
      scheduledAt: new Date(Date.now() + 2 * 60_000).toISOString(),
      durationHours: 5 / 60,
    });

    expect(create.mock.calls[0][0].durationMinutes).toBe(5);
  });

  test.each([
    ["another tutor's classroom", { ...activeClassroom, tutorId: ID.other }, inTwoHours(), 1, 404],
    ["a completed classroom", { ...activeClassroom, status: "completed" }, inTwoHours(), 1, 400],
    ["a start in 30 seconds", activeClassroom, new Date(Date.now() + 30_000).toISOString(), 1, 400],
    ["a 10 minute duration", activeClassroom, inTwoHours(), 10 / 60, 400],
    ["a 0.25 hour duration", activeClassroom, inTwoHours(), 0.25, 400],
    ["a 1.25 hour duration", activeClassroom, inTwoHours(), 1.25, 400],
    ["a 4.5 hour duration", activeClassroom, inTwoHours(), 4.5, 400],
  ])("SE-04 refuses %s", async (_label, classroom, scheduledAt, durationHours, statusCode) => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(classroom as never);
    jest.spyOn(sessionRepository, "hasOverlap").mockResolvedValue(false);
    const create = mockCreate();

    await expect(
      sessionService.createSession(ID.classroom, ID.tutor, { scheduledAt, durationHours })
    ).rejects.toMatchObject({ statusCode });
    expect(create).not.toHaveBeenCalled();
  });

  test("SE-05 an overlapping slot is 409", async () => {
    jest.spyOn(classroomRepository, "findById").mockResolvedValue(activeClassroom as never);
    jest.spyOn(sessionRepository, "hasOverlap").mockResolvedValue(true);
    const create = mockCreate();

    await expect(
      sessionService.createSession(ID.classroom, ID.tutor, {
        scheduledAt: inTwoHours(),
        durationHours: 1,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("sessionService.cancelSession", () => {
  test.each(["scheduled", "ongoing"])(
    "SE-06 tutor can cancel a session that is %s",
    async (status) => {
      jest.spyOn(sessionRepository, "findById").mockResolvedValue(sessionRow({ status }) as never);
      const cancel = jest
        .spyOn(sessionRepository, "cancel")
        .mockResolvedValue(sessionRow({ status: "cancelled" }) as never);

      expect((await sessionService.cancelSession(ID.session, ID.tutor)).status).toBe("cancelled");
      expect(cancel).toHaveBeenCalledWith(ID.session, ID.tutor);
    }
  );

  test.each([
    ["a missing session", null, ID.tutor, 404],
    ["the student", sessionRow(), ID.student, 403],
    ["a completed session", sessionRow({ status: "completed" }), ID.tutor, 400],
    ["a cancelled session", sessionRow({ status: "cancelled" }), ID.tutor, 400],
  ])("SE-07 refuses %s", async (_label, row, userId, statusCode) => {
    jest.spyOn(sessionRepository, "findById").mockResolvedValue(row as never);
    const cancel = jest.spyOn(sessionRepository, "cancel");

    await expect(sessionService.cancelSession(ID.session, userId)).rejects.toMatchObject({
      statusCode,
    });
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe("runSessionSettlementTick", () => {
  const noticeRow = {
    id: "m1",
    conversationId: ID.conversation,
    text: "Payment settled",
    createdAt: NOW,
    type: "system",
    senderId: null,
    sender: null,
  } as never;
  const message = serializeMessage(noticeRow);

  beforeEach(() => {
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  test("SE-08 advances sessions, settles each due one, then broadcasts notices", async () => {
    const advance = jest.spyOn(sessionRepository, "advanceScheduled").mockResolvedValue();
    jest
      .spyOn(sessionRepository, "findDueForSettlement")
      .mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
    const settle = jest
      .spyOn(transactionRepository, "settleSession")
      .mockResolvedValue({ kind: "completed" } as never);
    jest.spyOn(sessionRepository, "findPendingSettlementNotices").mockResolvedValue([{ id: "s1" }]);
    jest.spyOn(conversationRepository, "createSettlementNotice").mockResolvedValue(noticeRow);
    const broadcast = jest.fn();

    await runSessionSettlementTick(broadcast, NOW);

    expect(advance).toHaveBeenCalledWith(NOW);
    expect(settle.mock.calls).toEqual([
      ["s1", NOW],
      ["s2", NOW],
    ]);
    expect(broadcast).toHaveBeenCalledWith(message);
  });

  test("SE-09 one failed settlement does not stop the others or the notices", async () => {
    jest.spyOn(sessionRepository, "advanceScheduled").mockResolvedValue();
    jest
      .spyOn(sessionRepository, "findDueForSettlement")
      .mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
    const settle = jest
      .spyOn(transactionRepository, "settleSession")
      .mockRejectedValueOnce(new Error("deadlock"))
      .mockResolvedValueOnce({ kind: "completed" } as never);
    jest.spyOn(sessionRepository, "findPendingSettlementNotices").mockResolvedValue([{ id: "s9" }]);
    const notice = jest
      .spyOn(conversationRepository, "createSettlementNotice")
      .mockResolvedValue(null);

    await runSessionSettlementTick(jest.fn(), NOW);

    expect(settle).toHaveBeenCalledTimes(2);
    expect(notice).toHaveBeenCalledWith("s9");
  });

  test("SE-10 a failing due-session query still sends notices", async () => {
    jest.spyOn(sessionRepository, "advanceScheduled").mockRejectedValue(new Error("db down"));
    jest.spyOn(sessionRepository, "findPendingSettlementNotices").mockResolvedValue([{ id: "s1" }]);
    jest.spyOn(conversationRepository, "createSettlementNotice").mockResolvedValue(noticeRow);
    const broadcast = jest.fn();

    await runSessionSettlementTick(broadcast, NOW);

    expect(broadcast).toHaveBeenCalledWith(message);
  });

  test("SE-11 notice and broadcast failures are logged, not thrown, and no null is broadcast", async () => {
    jest.spyOn(sessionRepository, "advanceScheduled").mockResolvedValue();
    jest.spyOn(sessionRepository, "findDueForSettlement").mockResolvedValue([] as never);
    jest
      .spyOn(sessionRepository, "findPendingSettlementNotices")
      .mockResolvedValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    jest
      .spyOn(conversationRepository, "createSettlementNotice")
      .mockRejectedValueOnce(new Error("write failed"))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(noticeRow);
    const broadcast = jest.fn(() => {
      throw new Error("socket down");
    });

    await expect(runSessionSettlementTick(broadcast, NOW)).resolves.toBeUndefined();
    expect(broadcast).toHaveBeenCalledTimes(1);
  });
});

describe("sessionRepository", () => {
  function fakeLockedSession(session: object | null) {
    const update = jest.fn(async (args: { data: object }) => ({ ...session, ...args.data }));
    const findUniqueOrThrow = jest.fn(async () => session);
    fakeTransaction({
      meetSession: { findUnique: jest.fn(async () => session), update, findUniqueOrThrow },
    });
    return { update, findUniqueOrThrow };
  }

  test("SR-01 recordAttendance stores the tutor's first join and the start time", async () => {
    const { update } = fakeLockedSession(sessionRow());

    await sessionRepository.recordAttendance(ID.session, ID.tutor, NOW);

    expect(update.mock.calls[0][0].data).toEqual({ tutorJoinedAt: NOW, startedAt: NOW });
  });

  test("SR-02 recordAttendance keeps the original start time for the second participant", async () => {
    const startedAt = new Date(NOW.getTime() - 60_000);
    const { update } = fakeLockedSession(sessionRow({ startedAt }));

    await sessionRepository.recordAttendance(ID.session, ID.student, NOW);

    expect(update.mock.calls[0][0].data).toEqual({ studentJoinedAt: NOW, startedAt });
  });

  test("SR-03 recordAttendance is idempotent for a repeat join", async () => {
    const { update, findUniqueOrThrow } = fakeLockedSession(
      sessionRow({ tutorJoinedAt: new Date(NOW.getTime() - 60_000) })
    );

    await sessionRepository.recordAttendance(ID.session, ID.tutor, NOW);

    expect(update).not.toHaveBeenCalled();
    expect(findUniqueOrThrow).toHaveBeenCalled();
  });

  test.each([
    ["an outsider", sessionRow(), ID.other, NOW, 404],
    ["a cancelled session", sessionRow({ status: "cancelled" }), ID.tutor, NOW, 400],
    [
      "a session without tracking",
      sessionRow({ attendanceTrackingEnabled: false }),
      ID.tutor,
      NOW,
      400,
    ],
    ["a click before the start", sessionRow(), ID.tutor, new Date(NOW.getTime() - HOUR), 400],
    ["a click at the exact end", sessionRow(), ID.tutor, new Date(NOW.getTime() + HOUR / 2), 400],
  ])("SR-04 recordAttendance refuses %s", async (_label, row, userId, now, statusCode) => {
    const { update } = fakeLockedSession(row);

    await expect(sessionRepository.recordAttendance(ID.session, userId, now)).rejects.toMatchObject(
      { statusCode }
    );
    expect(update).not.toHaveBeenCalled();
  });

  test("SR-05 cancel only updates the row if its status has not changed", async () => {
    const { update } = fakeLockedSession(sessionRow({ status: "ongoing" }));

    await sessionRepository.cancel(ID.session, ID.tutor, NOW);

    expect(update.mock.calls[0][0]).toMatchObject({
      where: { id: ID.session, status: "ongoing" },
      data: { status: "cancelled" },
    });
  });

  test("SR-06 cancel is refused once the session end + 1 min grace has passed", async () => {
    const { update } = fakeLockedSession(sessionRow({ status: "ongoing" }));
    const afterGrace = new Date(NOW.getTime() + HOUR / 2 + 60_000);

    await expect(sessionRepository.cancel(ID.session, ID.tutor, afterGrace)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("cutoff"),
    });
    expect(update).not.toHaveBeenCalled();
  });

  test("SR-07 create refuses a classroom that is no longer active", async () => {
    const create = jest.fn();
    fakeTransaction({
      $queryRaw: jest.fn(async () => [{ status: "completed" }]),
      meetSession: { create },
    });

    await expect(
      sessionRepository.create({
        classroomId: ID.classroom,
        scheduledAt: NOW,
        durationMinutes: 60,
        meetLink: "x",
        meetSpaceName: null,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(create).not.toHaveBeenCalled();
  });

  test("SR-08 create turns on attendance tracking", async () => {
    const create = jest.fn(async (_args: { data: object }) => sessionRow());
    fakeTransaction({
      $queryRaw: jest.fn(async () => [{ status: "active" }]),
      meetSession: { create },
    });

    await sessionRepository.create({
      classroomId: ID.classroom,
      scheduledAt: NOW,
      durationMinutes: 60,
      meetLink: "x",
      meetSpaceName: null,
    });

    expect(create.mock.calls[0][0].data).toMatchObject({ attendanceTrackingEnabled: true });
  });

  test.each([
    ["ends exactly at the new start", 9, 1, false],
    ["ends one minute into the new start", 9 + 1 / 60, 1, true],
    ["starts and ends inside", 10.25, 0.5, true],
  ])(
    "SR-09 hasOverlap: existing session that %s",
    async (_label, startHour, duration, expected) => {
      const day = Date.UTC(2026, 4, 1);
      fakePrisma({
        meetSession: {
          findMany: jest.fn(async () => [
            {
              scheduledAt: new Date(day + startHour * HOUR),
              durationMinutes: duration * 60,
            },
          ]),
        },
      });

      const result = await sessionRepository.hasOverlap(
        ID.tutor,
        ID.student,
        new Date(day + 10 * HOUR),
        new Date(day + 11 * HOUR)
      );

      expect(result).toBe(expected);
    }
  );

  test("SR-10 hasOverlap ignores cancelled and missed sessions and the excluded id", async () => {
    const findMany = jest.fn(async (_args: { where: object }) => []);
    fakePrisma({ meetSession: { findMany } });

    await sessionRepository.hasOverlap(ID.tutor, ID.student, NOW, NOW, ID.session);

    expect(findMany.mock.calls[0][0].where).toMatchObject({
      status: { notIn: ["cancelled", "missed"] },
      id: { not: ID.session },
      classroom: { OR: [{ tutorId: ID.tutor }, { studentId: ID.student }] },
    });
  });
});

describe("sessionController", () => {
  const tutor = { id: ID.tutor, role: "tutor" };

  test.each([
    ["getSession", sessionController.getSession],
    ["recordAttendance", sessionController.recordAttendance],
    ["createSession", sessionController.createSession],
    ["cancelSession", sessionController.cancelSession],
  ])("SC-01 %s without a user is 401", async (_label, handler) => {
    const { error } = await callController(handler, {});

    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  test("SC-02 createSession returns 201 for valid input", async () => {
    const create = jest.spyOn(sessionService, "createSession").mockResolvedValue({} as never);
    const body = { scheduledAt: "2026-06-01T10:00:00.000Z", durationHours: 2 };

    const { res } = await callController(sessionController.createSession, {
      user: tutor,
      params: { classroomId: ID.classroom },
      body,
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(create).toHaveBeenCalledWith(ID.classroom, ID.tutor, body);
  });

  test.each([
    ["a non-ISO date", { scheduledAt: "June 1", durationHours: 1 }],
    ["a 5 hour duration", { scheduledAt: "2026-06-01T10:00:00Z", durationHours: 5 }],
    ["an extra field", { scheduledAt: "2026-06-01T10:00:00Z", durationHours: 1, meetLink: "x" }],
  ])("SC-03 createSession rejects %s", async (_label, body) => {
    const { error } = await callController(sessionController.createSession, {
      user: tutor,
      params: { classroomId: ID.classroom },
      body,
    });

    expect(error).toBeInstanceOf(ZodError);
  });

  test("SC-04 recordAttendance rejects a non-JSON or non-empty body", async () => {
    const record = jest.spyOn(sessionService, "recordAttendance");
    const params = { sessionId: ID.session };

    const text = await callController(sessionController.recordAttendance, {
      user: tutor,
      params,
      headers: { "content-length": "3" },
      is: () => false,
    });
    const json = await callController(sessionController.recordAttendance, {
      user: tutor,
      params,
      body: { joinedAt: "now" },
    });

    expect(text.error?.statusCode).toBe(400);
    expect(json.error).toBeInstanceOf(ZodError);
    expect(record).not.toHaveBeenCalled();
  });

  test("SC-05 recordAttendance and getSession are never cached", async () => {
    jest.spyOn(sessionService, "recordAttendance").mockResolvedValue({} as never);
    jest.spyOn(sessionService, "getSession").mockResolvedValue({} as never);
    const params = { sessionId: ID.session };

    const record = await callController(sessionController.recordAttendance, {
      user: tutor,
      params,
    });
    const get = await callController(sessionController.getSession, { user: tutor, params });

    expect(record.res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(get.res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  test("SC-06 cancelSession rejects a bad session id", async () => {
    const { error } = await callController(sessionController.cancelSession, {
      user: tutor,
      params: { sessionId: "1" },
    });

    expect(error).toBeInstanceOf(ZodError);
  });
});
