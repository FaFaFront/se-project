import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { authRepository } from "../src/repository/auth.repository.js";
import { subjectRepository } from "../src/repository/subject.repository.js";
import { classroomService } from "../src/service/classroom.service.js";
import { conversationService } from "../src/service/conversation.service.js";
import { transactionService } from "../src/service/transaction.service.js";
import { tutorService } from "../src/service/tutor.service.js";
import { userService } from "../src/service/user.service.js";
import { ID } from "./helpers.js";

type Rule = { active: boolean; role?: "tutor" | "student" };
type Route = [method: string, path: string, rule: Rule];

/**
 * Every protected endpoint and the guards its router must apply.
 * Paths use "x" for ids so an allowed request stops at validation (400), before the database.
 */
const PROTECTED: Route[] = [
  ["GET", "/classrooms", { active: true }],
  ["POST", "/classrooms", { active: true, role: "tutor" }],
  ["GET", "/classrooms/x", { active: true }],
  ["PATCH", "/classrooms/x", { active: true, role: "tutor" }],
  ["PATCH", "/classrooms/x/deactivate", { active: true, role: "tutor" }],
  ["POST", "/classrooms/x/sessions", { active: true, role: "tutor" }],
  ["POST", "/classrooms/x/review", { active: true, role: "student" }],
  ["GET", "/sessions/x", { active: true }],
  ["POST", "/sessions/x/attendance", { active: true }],
  ["PATCH", "/sessions/x/cancel", { active: true, role: "tutor" }],
  ["GET", "/conversations", { active: true }],
  ["POST", "/conversations", { active: true }],
  ["GET", "/conversations/x/messages", { active: true }],
  ["POST", "/upload/presigned-url", { active: true }],
  ["POST", "/users/profile", { active: true }],
  ["PUT", "/users/profile", { active: true }],
  // An inactive tutor must still be able to load their profile and reactivate.
  ["GET", "/users/me", { active: false }],
  ["PATCH", "/users/me/status", { active: false }],
  // Inactive tutors can still withdraw their balance; these roles are checked in the controller.
  ["GET", "/transactions", { active: false }],
  ["GET", "/transactions/x", { active: false }],
  ["GET", "/transactions/top-ups/options", { active: false, role: "student" }],
  ["POST", "/transactions/top-ups", { active: false, role: "student" }],
  ["POST", "/transactions/withdrawals", { active: false, role: "tutor" }],
  ["GET", "/transactions/withdrawals/by-request/x", { active: false, role: "tutor" }],
];

const PUBLIC: [method: string, path: string][] = [
  ["POST", "/auth/register"],
  ["POST", "/auth/login"],
  ["POST", "/auth/logout"],
  ["GET", "/subjects"],
  ["GET", "/tutors"],
  ["GET", "/tutors/x"],
];

let server: Server;
let baseUrl: string;
let accountStatus: "ACTIVE" | "INACTIVE";

const token = (role: string) =>
  jwt.sign({ sub: ID.user, role }, env.JWT_SECRET, { expiresIn: "1h" });

async function call(method: string, path: string, role?: string) {
  const res = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(role && { Authorization: `Bearer ${token(role)}` }),
    },
    // An empty object fails every create/update schema with a 400 once the guards pass.
    ...(method === "GET" ? {} : { body: "{}" }),
  });
  return res.status;
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  accountStatus = "ACTIVE";
  jest
    .spyOn(authRepository, "findAccountStatusById")
    .mockImplementation(async (id) => ({ id, accountStatus }));
  // Endpoints with no input to reject would reach the database; answer them here instead.
  jest.spyOn(classroomService, "listClassroomsForUser").mockResolvedValue([]);
  jest.spyOn(conversationService, "listForUser").mockResolvedValue([]);
  jest.spyOn(userService, "getProfile").mockResolvedValue({} as never);
  jest.spyOn(transactionService, "list").mockResolvedValue({} as never);
  jest.spyOn(transactionService, "getTopUpOptions").mockResolvedValue({} as never);
  jest.spyOn(subjectRepository, "findAll").mockResolvedValue([]);
  jest.spyOn(tutorService, "listTutors").mockResolvedValue([]);
});

describe("route guards", () => {
  test.each(PROTECTED)("RT-01 %s %s without a token is 401", async (method, path) => {
    expect(await call(method, path)).toBe(401);
  });

  test.each(PROTECTED)("RT-02 %s %s with a forged token is 401", async (method, path) => {
    const res = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers: { Authorization: `Bearer ${jwt.sign({ sub: ID.user, role: "tutor" }, "wrong")}` },
    });

    expect(res.status).toBe(401);
  });

  test.each(PROTECTED.filter(([, , rule]) => rule.active))(
    "RT-03 %s %s refuses an inactive account with 403",
    async (method, path, rule) => {
      accountStatus = "INACTIVE";

      expect(await call(method, path, rule.role ?? "tutor")).toBe(403);
    }
  );

  test.each(PROTECTED.filter(([, , rule]) => !rule.active))(
    "RT-04 %s %s still works for an inactive account",
    async (method, path, rule) => {
      accountStatus = "INACTIVE";

      expect([401, 403]).not.toContain(await call(method, path, rule.role ?? "tutor"));
    }
  );

  test.each(PROTECTED.filter(([, , rule]) => rule.role))(
    "RT-05 %s %s refuses the wrong role with 403",
    async (method, path, rule) => {
      expect(await call(method, path, rule.role === "tutor" ? "student" : "tutor")).toBe(403);
    }
  );

  test.each(PROTECTED)("RT-06 %s %s lets the allowed user through", async (method, path, rule) => {
    const status = await call(method, path, rule.role ?? "tutor");

    expect([401, 403]).not.toContain(status);
    expect(status).toBeLessThan(500);
  });

  test.each(PUBLIC)("RT-07 %s %s needs no token", async (method, path) => {
    const status = await call(method, path);

    expect(status).not.toBe(401);
    expect(status).toBeLessThan(500);
  });
});

describe("app", () => {
  test("RT-08 malformed JSON is a 400 with the standard envelope", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, message: "Invalid request body" });
  });

  test("RT-09 an unknown route is 404", async () => {
    expect(await call("GET", "/nope")).toBe(404);
  });
});
