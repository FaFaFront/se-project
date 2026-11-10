import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { UnauthorizedError } from "../src/common/errors/app-error.js";
import { userController } from "../src/controller/user.controller.js";
import { classroomRepository } from "../src/repository/classroom.repository.js";
import { subjectRepository } from "../src/repository/subject.repository.js";
import { userRepository } from "../src/repository/user.repository.js";
import { userService } from "../src/service/user.service.js";
import { callController, ID, knownPrismaError } from "./helpers.js";

function profileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.user,
    name: "Amy",
    email: "amy@gmail.com",
    role: "tutor",
    accountStatus: "ACTIVE",
    profileUrl: null,
    bio: null,
    hourlyRate: new Prisma.Decimal("450.50"),
    gradeLevel: null,
    goals: null,
    walletBalance: new Prisma.Decimal("1200.25"),
    profileComplete: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    tutorSubjects: [{ subject: { id: ID.subject, name: "Math" } }],
    ...overrides,
  };
}

const owner = (role: string, profileComplete = true) => ({ id: ID.user, role, profileComplete });
const editable = { name: "Amy", profileUrl: null, bio: null };

afterEach(() => {
  jest.restoreAllMocks();
});

describe("userService.completeProfile", () => {
  test("US-01 student profile saves grade level and goals and marks it complete", async () => {
    const update = jest.spyOn(userRepository, "updateProfile").mockResolvedValue({} as never);

    await userService.completeProfile(ID.user, "student", {
      name: "Amy",
      profileUrl: null,
      gradeLevel: "M.6",
      goals: "Pass exams",
    });

    expect(update).toHaveBeenCalledWith(ID.user, {
      profileComplete: true,
      name: "Amy",
      profileUrl: null,
      gradeLevel: "M.6",
      goals: "Pass exams",
    });
  });

  test("US-02 tutor profile stores the hourly rate as a Decimal", async () => {
    const update = jest.spyOn(userRepository, "updateProfile").mockResolvedValue({} as never);

    await userService.completeProfile(ID.user, "tutor", { hourlyRate: 300 });

    const data = update.mock.calls[0][1];
    expect(data.hourlyRate).toBeInstanceOf(Prisma.Decimal);
    expect(String(data.hourlyRate)).toBe("300");
    expect(data).not.toHaveProperty("name");
  });

  test.each([
    ["student without goals", "student", { gradeLevel: "M.6" }, "Grade level and goals"],
    ["student without grade", "student", { goals: "x" }, "Grade level and goals"],
    ["tutor without rate", "tutor", {}, "Hourly rate is required"],
    ["unknown role", "admin", { hourlyRate: 1 }, "Invalid user role"],
  ])("US-03 rejects %s with 400", async (_label, role, data, message) => {
    const update = jest.spyOn(userRepository, "updateProfile");

    await expect(userService.completeProfile(ID.user, role as never, data)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining(message),
    });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("userService.getProfile", () => {
  test("US-04 converts decimals to numbers and flattens subjects", async () => {
    jest.spyOn(userRepository, "findById").mockResolvedValue(profileRow() as never);

    const profile = await userService.getProfile(ID.user);

    expect(profile).toMatchObject({
      hourlyRate: 450.5,
      walletBalance: 1200.25,
      subjects: [{ id: ID.subject, name: "Math" }],
    });
    expect(profile).not.toHaveProperty("passwordHash");
  });

  test("US-05 keeps a missing hourly rate as null, not 0", async () => {
    jest
      .spyOn(userRepository, "findById")
      .mockResolvedValue(profileRow({ hourlyRate: null, tutorSubjects: [] }) as never);

    expect(await userService.getProfile(ID.user)).toMatchObject({ hourlyRate: null, subjects: [] });
  });

  test("US-06 unknown user is 404", async () => {
    jest.spyOn(userRepository, "findById").mockResolvedValue(null);

    await expect(userService.getProfile(ID.user)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("userService.updateProfile", () => {
  test("US-07 student update only sends the fields that were given", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("student") as never);
    const update = jest
      .spyOn(userRepository, "updateExistingProfile")
      .mockResolvedValue(profileRow({ role: "student" }) as never);

    await userService.updateProfile(ID.user, {
      role: "student",
      data: { ...editable, goals: "New goal" },
    });

    expect(update).toHaveBeenCalledWith(ID.user, { ...editable, goals: "New goal" }, undefined);
  });

  test("US-08 tutor update checks subjects exist and replaces them", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    jest.spyOn(subjectRepository, "findByIds").mockResolvedValue([{ id: ID.subject }]);
    const update = jest
      .spyOn(userRepository, "updateExistingProfile")
      .mockResolvedValue(profileRow() as never);

    await userService.updateProfile(ID.user, {
      role: "tutor",
      data: { ...editable, hourlyRate: 600, subjectIds: [ID.subject] },
    });

    const [, data, subjectIds] = update.mock.calls[0];
    expect(String((data as { hourlyRate: Prisma.Decimal }).hourlyRate)).toBe("600");
    expect(subjectIds).toEqual([ID.subject]);
  });

  test("US-09 lists every unknown subject id and saves nothing", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    jest.spyOn(subjectRepository, "findByIds").mockResolvedValue([{ id: ID.subject }]);
    const update = jest.spyOn(userRepository, "updateExistingProfile");

    await expect(
      userService.updateProfile(ID.user, {
        role: "tutor",
        data: { ...editable, subjectIds: [ID.subject, ID.other, ID.tutor] },
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: `Unknown subject IDs: ${ID.other}, ${ID.tutor}`,
    });
    expect(update).not.toHaveBeenCalled();
  });

  test.each([
    ["the user no longer exists", null, 401],
    ["the token role differs from the account", owner("student"), 401],
    ["the first profile is not completed", owner("tutor", false), 409],
  ])("US-10 refuses when %s", async (_label, profileOwner, statusCode) => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(profileOwner as never);
    const update = jest.spyOn(userRepository, "updateExistingProfile");

    await expect(
      userService.updateProfile(ID.user, { role: "tutor", data: editable })
    ).rejects.toMatchObject({ statusCode });
    expect(update).not.toHaveBeenCalled();
  });

  test("US-11 a user deleted mid-update (P2025) becomes 401; other errors pass through", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    const update = jest
      .spyOn(userRepository, "updateExistingProfile")
      .mockRejectedValueOnce(knownPrismaError("P2025"));

    await expect(
      userService.updateProfile(ID.user, { role: "tutor", data: editable })
    ).rejects.toBeInstanceOf(UnauthorizedError);

    const failure = new Error("down");
    update.mockRejectedValueOnce(failure);
    await expect(
      userService.updateProfile(ID.user, { role: "tutor", data: editable })
    ).rejects.toBe(failure);
  });
});

describe("userService.updateAccountStatus", () => {
  test("US-12 tutor with no active classrooms can deactivate", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    jest.spyOn(classroomRepository, "countActiveByTutor").mockResolvedValue(0);
    const update = jest
      .spyOn(userRepository, "updateAccountStatus")
      .mockResolvedValue(profileRow({ accountStatus: "INACTIVE" }) as never);

    const result = await userService.updateAccountStatus(ID.user, "INACTIVE");

    expect(update).toHaveBeenCalledWith(ID.user, "INACTIVE");
    expect(result.accountStatus).toBe("INACTIVE");
  });

  test("US-13 tutor with an active classroom cannot deactivate (409)", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    jest.spyOn(classroomRepository, "countActiveByTutor").mockResolvedValue(1);
    const update = jest.spyOn(userRepository, "updateAccountStatus");

    await expect(userService.updateAccountStatus(ID.user, "INACTIVE")).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(update).not.toHaveBeenCalled();
  });

  test("US-14 reactivating skips the active-classroom check", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    const count = jest.spyOn(classroomRepository, "countActiveByTutor");
    jest.spyOn(userRepository, "updateAccountStatus").mockResolvedValue(profileRow() as never);

    await userService.updateAccountStatus(ID.user, "ACTIVE");

    expect(count).not.toHaveBeenCalled();
  });

  test.each([
    ["a student", owner("student"), 403],
    ["a missing user", null, 401],
  ])("US-15 refuses %s", async (_label, profileOwner, statusCode) => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(profileOwner as never);

    await expect(userService.updateAccountStatus(ID.user, "INACTIVE")).rejects.toMatchObject({
      statusCode,
    });
  });

  test("US-16 a user deleted mid-update (P2025) becomes 401", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(owner("tutor") as never);
    jest.spyOn(userRepository, "updateAccountStatus").mockRejectedValue(knownPrismaError("P2025"));

    await expect(userService.updateAccountStatus(ID.user, "ACTIVE")).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });
});

describe("userController", () => {
  const student = { id: ID.user, role: "student" };
  const tutor = { id: ID.user, role: "tutor" };

  test("UC-01 submitProfile validates by role and returns 200", async () => {
    const complete = jest.spyOn(userService, "completeProfile").mockResolvedValue({} as never);

    const { res } = await callController(userController.submitProfile, {
      user: student,
      body: { gradeLevel: " M.6 ", goals: "Pass" },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(complete).toHaveBeenCalledWith(ID.user, "student", { gradeLevel: "M.6", goals: "Pass" });
  });

  test.each([
    ["student sends hourlyRate", student, { gradeLevel: "M.6", goals: "x", hourlyRate: 1 }],
    ["student misses goals", student, { gradeLevel: "M.6" }],
    ["tutor sends 0 rate", tutor, { hourlyRate: 0 }],
    ["tutor sends text rate", tutor, { hourlyRate: "100" }],
    ["bad profile URL", tutor, { hourlyRate: 100, profileUrl: "not a url" }],
    ["name over 100 chars", tutor, { hourlyRate: 100, name: "a".repeat(101) }],
  ])("UC-02 submitProfile rejects when %s", async (_label, user, body) => {
    const complete = jest.spyOn(userService, "completeProfile");

    const { error } = await callController(userController.submitProfile, { user, body });

    expect(error).toBeInstanceOf(ZodError);
    expect(complete).not.toHaveBeenCalled();
  });

  test("UC-03 submitProfile rejects an unknown role with 400", async () => {
    const { error } = await callController(userController.submitProfile, {
      user: { id: ID.user, role: "admin" },
      body: {},
    });

    expect(error?.statusCode).toBe(400);
  });

  test.each([
    ["submitProfile", userController.submitProfile],
    ["getProfile", userController.getProfile],
    ["updateProfile", userController.updateProfile],
    ["updateAccountStatus", userController.updateAccountStatus],
  ])("UC-04 %s without a user is 401", async (_label, handler) => {
    const { error } = await callController(handler, {});

    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  test("UC-05 getProfile is never cached", async () => {
    jest.spyOn(userService, "getProfile").mockResolvedValue({ id: ID.user } as never);

    const { res, body } = await callController(userController.getProfile, { user: student });

    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(body).toMatchObject({ success: true, data: { id: ID.user } });
  });

  test("UC-06 updateProfile requires name, profileUrl and bio and trims them", async () => {
    const update = jest.spyOn(userService, "updateProfile").mockResolvedValue({} as never);

    await callController(userController.updateProfile, {
      user: tutor,
      body: { name: " Amy ", profileUrl: null, bio: " hi ", subjectIds: [ID.subject] },
    });

    expect(update).toHaveBeenCalledWith(ID.user, {
      role: "tutor",
      data: { name: "Amy", profileUrl: null, bio: "hi", subjectIds: [ID.subject] },
    });
  });

  test.each([
    ["missing bio", tutor, { name: "Amy", profileUrl: null }],
    ["duplicate subject ids", tutor, { ...editable, subjectIds: [ID.subject, ID.subject] }],
    ["non-uuid subject id", tutor, { ...editable, subjectIds: ["math"] }],
    ["student sends subjectIds", student, { ...editable, subjectIds: [ID.subject] }],
    ["bio over 1000 chars", student, { ...editable, bio: "a".repeat(1001) }],
  ])("UC-07 updateProfile rejects %s", async (_label, user, body) => {
    const update = jest.spyOn(userService, "updateProfile");

    const { error } = await callController(userController.updateProfile, { user, body });

    expect(error).toBeInstanceOf(ZodError);
    expect(update).not.toHaveBeenCalled();
  });

  test.each([
    ["INACTIVE", "Account is now inactive. Your data has been kept."],
    ["ACTIVE", "Account is now active."],
  ])("UC-08 updateAccountStatus %s gives the matching message", async (status, message) => {
    jest.spyOn(userService, "updateAccountStatus").mockResolvedValue({} as never);

    const { body } = await callController(userController.updateAccountStatus, {
      user: tutor,
      body: { status },
    });

    expect(body.message).toBe(message);
  });

  test.each([{ status: "inactive" }, { status: "ACTIVE", extra: true }, {}])(
    "UC-09 updateAccountStatus rejects body %j",
    async (body) => {
      const { error } = await callController(userController.updateAccountStatus, {
        user: tutor,
        body,
      });

      expect(error).toBeInstanceOf(ZodError);
    }
  );
});
