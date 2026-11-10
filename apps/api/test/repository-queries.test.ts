import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { authRepository } from "../src/repository/auth.repository.js";
import { classroomRepository } from "../src/repository/classroom.repository.js";
import { conversationRepository } from "../src/repository/conversation.repository.js";
import { subjectRepository } from "../src/repository/subject.repository.js";
import { userRepository } from "../src/repository/user.repository.js";
import { fakePrisma, ID, restorePrisma } from "./helpers.js";

type Args = { where?: Record<string, unknown>; data?: Record<string, unknown>; select?: object };
const recorder = () => jest.fn(async (_args: Args) => null as unknown);

afterEach(() => {
  restorePrisma();
});

describe("userRepository", () => {
  const profile = { name: "Amy", profileUrl: null, bio: null };

  test("RQ-01 leaving subjectIds out keeps the tutor's subjects", async () => {
    const update = recorder();
    fakePrisma({ user: { update } });

    await userRepository.updateExistingProfile(ID.user, profile);

    expect(update.mock.calls[0][0].data).toEqual(profile);
  });

  test("RQ-02 an empty subjectIds list removes every subject", async () => {
    const update = recorder();
    fakePrisma({ user: { update } });

    await userRepository.updateExistingProfile(ID.user, profile, []);

    expect(update.mock.calls[0][0].data).toEqual({
      ...profile,
      tutorSubjects: { deleteMany: {}, create: [] },
    });
  });

  test("RQ-03 a subjectIds list replaces the subjects", async () => {
    const update = recorder();
    fakePrisma({ user: { update } });

    await userRepository.updateExistingProfile(ID.user, profile, [ID.subject]);

    expect(update.mock.calls[0][0].data?.tutorSubjects).toEqual({
      deleteMany: {},
      create: [{ subject: { connect: { id: ID.subject } } }],
    });
  });

  test("RQ-04 profile reads never select the password hash", async () => {
    const findUnique = recorder();
    const update = recorder();
    fakePrisma({ user: { findUnique, update } });

    await userRepository.findById(ID.user);
    await userRepository.updateProfile(ID.user, { name: "Amy" });
    await userRepository.updateAccountStatus(ID.user, "INACTIVE");

    for (const call of [...findUnique.mock.calls, ...update.mock.calls]) {
      expect(call[0].select).not.toHaveProperty("passwordHash");
    }
  });

  test("RQ-05 the password check reads only role and hash", async () => {
    const findUnique = recorder();
    fakePrisma({ user: { findUnique } });

    await userRepository.findForPasswordVerification(ID.user);
    await userRepository.findRoleById(ID.user);
    await userRepository.findProfileOwnerById(ID.user);

    expect(findUnique.mock.calls.map((call) => call[0].select)).toEqual([
      { role: true, passwordHash: true },
      { role: true },
      { id: true, role: true, profileComplete: true },
    ]);
  });
});

describe("authRepository", () => {
  test("RQ-06 email lookup ignores letter case", async () => {
    const findFirst = recorder();
    fakePrisma({ user: { findFirst } });

    await authRepository.findByEmail("Amy@Gmail.com");

    expect(findFirst.mock.calls[0][0].where).toEqual({
      email: { equals: "Amy@Gmail.com", mode: "insensitive" },
    });
  });

  test("RQ-07 create stores the hash, never a plain password field", async () => {
    const create = recorder();
    fakePrisma({ user: { create } });

    await authRepository.create("a@b.c", "hash", "tutor");

    expect(create.mock.calls[0][0].data).toEqual({
      email: "a@b.c",
      passwordHash: "hash",
      role: "tutor",
    });
  });
});

describe("classroomRepository lists", () => {
  test.each([
    ["findByTutor", "tutorId", "student"],
    ["findByStudent", "studentId", "tutor"],
  ] as const)(
    "RQ-08 %s combines filters and searches the other person",
    async (method, owner, other) => {
      const findMany = jest.fn(async (_args: Args & { orderBy?: unknown }) => []);
      fakePrisma({ classroom: { findMany } });

      await classroomRepository[method](ID.user, {
        search: "math",
        subjectId: ID.subject,
        status: "active",
      });

      const args = findMany.mock.calls[0][0];
      expect(args.where).toEqual({
        [owner]: ID.user,
        subjectId: ID.subject,
        status: "active",
        OR: [
          { [other]: { name: { contains: "math", mode: "insensitive" } } },
          { subject: { name: { contains: "math", mode: "insensitive" } } },
        ],
      });
      expect(args.orderBy).toEqual([{ createdAt: "desc" }, { id: "asc" }]);
    }
  );

  test("RQ-09 with no filter only the owner is matched", async () => {
    const findMany = jest.fn(async (_args: Args) => []);
    fakePrisma({ classroom: { findMany } });

    await classroomRepository.findByTutor(ID.tutor, {});

    expect(findMany.mock.calls[0][0].where).toEqual({ tutorId: ID.tutor });
  });

  test("RQ-10 edits, completion and the active count only touch the tutor's active classrooms", async () => {
    const updateMany = jest.fn(async (_args: Args) => ({ count: 1 }));
    const count = jest.fn(async (_args: Args) => 2);
    fakePrisma({ classroom: { updateMany, count } });
    const activeOwned = { id: ID.classroom, tutorId: ID.tutor, status: "active" };

    await classroomRepository.completeActive(ID.classroom, ID.tutor);
    await classroomRepository.updateActiveDetails(ID.classroom, ID.tutor, {
      subjectId: ID.subject,
      pricePerHour: 1 as never,
    });
    expect(await classroomRepository.countActiveByTutor(ID.tutor)).toBe(2);

    expect(updateMany.mock.calls.map((call) => call[0].where)).toEqual([activeOwned, activeOwned]);
    expect(updateMany.mock.calls[0][0].data).toEqual({ status: "completed" });
    expect(count.mock.calls[0][0].where).toEqual({ tutorId: ID.tutor, status: "active" });
  });
});

describe("conversationRepository participant checks", () => {
  test.each([
    "findByIdForParticipant",
    "findParticipantsForParticipant",
    "findMessageHistoryForParticipant",
  ] as const)("RQ-11 %s only matches a conversation the user is in", async (method) => {
    const findFirst = recorder();
    fakePrisma({ conversation: { findFirst } });

    await conversationRepository[method](ID.conversation, ID.user);

    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: ID.conversation,
      OR: [{ participantAId: ID.user }, { participantBId: ID.user }],
    });
  });

  test("RQ-12 the inbox loads only the latest message of each chat", async () => {
    const findMany = jest.fn(async (_args: Args & { include?: { messages?: object } }) => []);
    fakePrisma({ conversation: { findMany } });

    await conversationRepository.findAllForUser(ID.user);

    expect(findMany.mock.calls[0][0].include?.messages).toMatchObject({
      orderBy: { createdAt: "desc" },
      take: 1,
    });
  });

  test("RQ-13 a chat message is always stored as type text", async () => {
    const create = recorder();
    fakePrisma({ message: { create } });

    await conversationRepository.createMessage(ID.conversation, ID.user, "hi");

    expect(create.mock.calls[0][0].data).toEqual({
      conversationId: ID.conversation,
      senderId: ID.user,
      text: "hi",
      type: "text",
    });
  });
});

describe("subjectRepository", () => {
  test("RQ-14 findByIds asks only for the given ids", async () => {
    const findMany = jest.fn(async (_args: Args) => [{ id: ID.subject }]);
    fakePrisma({ subject: { findMany } });

    expect(await subjectRepository.findByIds([ID.subject])).toEqual([{ id: ID.subject }]);
    expect(findMany.mock.calls[0][0].where).toEqual({ id: { in: [ID.subject] } });
  });
});
