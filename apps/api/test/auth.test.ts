import { afterEach, describe, expect, jest, test } from "@jest/globals";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { verifyAccessToken } from "../src/common/auth/access-token.js";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../src/common/errors/app-error.js";
import {
  authMiddleware,
  requireActiveAccount,
  requireRole,
  type AuthRequest,
} from "../src/common/middleware/auth.middleware.js";
import { errorHandler } from "../src/common/middleware/error-handler.middleware.js";
import { env } from "../src/config/env.js";
import { authController } from "../src/controller/auth.controller.js";
import { authRepository } from "../src/repository/auth.repository.js";
import { authService } from "../src/service/auth.service.js";
import { callController, ID, knownPrismaError } from "./helpers.js";

const user = {
  id: ID.user,
  name: "Amy",
  email: "amy@gmail.com",
  role: "student",
  profileUrl: null,
  passwordHash: bcrypt.hashSync("correct-password", 4),
};

afterEach(() => {
  jest.restoreAllMocks();
});

async function runMiddleware(middleware: unknown, req: object) {
  const next = jest.fn();
  await (middleware as (req: unknown, res: unknown, next: unknown) => unknown)(req, {}, next);
  return next;
}

describe("authService.register", () => {
  test("AU-01 stores a hashed password and returns a token for the new user", async () => {
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(null);
    const create = jest.spyOn(authRepository, "create").mockResolvedValue(user as never);

    const result = await authService.register("amy@gmail.com", "plain-password", "student");

    const storedHash = create.mock.calls[0][1];
    expect(storedHash).not.toBe("plain-password");
    expect(await bcrypt.compare("plain-password", storedHash)).toBe(true);
    expect(verifyAccessToken(result.token)).toEqual({ id: ID.user, role: "student" });
    expect(result.user).toEqual({
      id: ID.user,
      name: "Amy",
      email: "amy@gmail.com",
      role: "student",
      profileUrl: null,
    });
  });

  test("AU-02 never returns the password hash", async () => {
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(null);
    jest.spyOn(authRepository, "create").mockResolvedValue(user as never);

    const result = await authService.register("amy@gmail.com", "plain-password", "student");

    expect(JSON.stringify(result)).not.toContain(user.passwordHash);
  });

  test("AU-03 rejects an email that already exists with 409", async () => {
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(user as never);
    const create = jest.spyOn(authRepository, "create");

    await expect(authService.register("amy@gmail.com", "x", "student")).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(create).not.toHaveBeenCalled();
  });

  test("AU-04 turns a simultaneous registration (P2002) into 409", async () => {
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(null);
    jest.spyOn(authRepository, "create").mockRejectedValue(knownPrismaError("P2002"));

    await expect(authService.register("amy@gmail.com", "x", "student")).rejects.toMatchObject({
      statusCode: 409,
      message: "An account with this email already exists",
    });
  });

  test("AU-05 rethrows other database errors unchanged", async () => {
    const failure = new Error("down");
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(null);
    jest.spyOn(authRepository, "create").mockRejectedValue(failure);

    await expect(authService.register("amy@gmail.com", "x", "student")).rejects.toBe(failure);
  });
});

describe("authService.login", () => {
  test("AU-06 returns a token for the right password", async () => {
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(user as never);

    const result = await authService.login("amy@gmail.com", "correct-password");

    expect(verifyAccessToken(result.token)).toEqual({ id: ID.user, role: "student" });
    expect(JSON.stringify(result)).not.toContain(user.passwordHash);
  });

  test("AU-07 token expires in 7 days", async () => {
    jest.spyOn(authRepository, "findByEmail").mockResolvedValue(user as never);

    const { token } = await authService.login("amy@gmail.com", "correct-password");

    const decoded = jwt.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  test("AU-08 gives the same 401 for an unknown email and a wrong password", async () => {
    const spy = jest.spyOn(authRepository, "findByEmail").mockResolvedValue(null);
    const unknownEmail = await authService.login("no@gmail.com", "x").catch((error) => error);

    spy.mockResolvedValue(user as never);
    const wrongPassword = await authService.login("amy@gmail.com", "wrong").catch((error) => error);

    expect(unknownEmail).toBeInstanceOf(UnauthorizedError);
    expect(wrongPassword).toBeInstanceOf(UnauthorizedError);
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });

  test("AU-09 logout succeeds with nothing to do", async () => {
    await expect(authService.logout()).resolves.toBeUndefined();
  });
});

describe("authController", () => {
  test("AU-10 register answers 201 with a trimmed, lowercased email", async () => {
    const register = jest.spyOn(authService, "register").mockResolvedValue({ token: "t" } as never);

    const { res, body } = await callController(authController.register as never, {
      body: { email: "  AMY@Gmail.com ", password: "12345678", role: "tutor" },
    });

    expect(register).toHaveBeenCalledWith("amy@gmail.com", "12345678", "tutor");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(body).toEqual({
      success: true,
      message: "Registration successful",
      data: { token: "t" },
    });
  });

  test.each([
    ["a bad email", { email: "nope", password: "12345678", role: "tutor" }, "valid email"],
    [
      "a 7 character password",
      { email: "a@b.co", password: "1234567", role: "tutor" },
      "8 characters",
    ],
    ["an unknown role", { email: "a@b.co", password: "12345678", role: "admin" }, "Role must be"],
  ])("AU-11 register rejects %s", async (_label, body, message) => {
    const register = jest.spyOn(authService, "register");

    const { error } = await callController(authController.register as never, { body });

    expect(error).toBeInstanceOf(ZodError);
    expect(error?.message).toContain(message);
    expect(register).not.toHaveBeenCalled();
  });

  test("AU-12 login answers 200 with a lowercased email", async () => {
    const login = jest.spyOn(authService, "login").mockResolvedValue({ token: "t" } as never);

    const { res } = await callController(authController.login as never, {
      body: { email: "AMY@gmail.com", password: "x" },
    });

    expect(login).toHaveBeenCalledWith("amy@gmail.com", "x");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("AU-13 login requires a password", async () => {
    const { error } = await callController(authController.login as never, {
      body: { email: "a@b.co", password: "" },
    });

    expect(error?.message).toContain("Password is required");
  });

  test("AU-14 login passes failures to the error handler", async () => {
    const failure = new UnauthorizedError("Invalid email or password");
    jest.spyOn(authService, "login").mockRejectedValue(failure);

    const { error } = await callController(authController.login as never, {
      body: { email: "a@b.co", password: "x" },
    });

    expect(error).toBe(failure);
  });

  test("AU-15 logout answers 200 with no data", async () => {
    const { body } = await callController(authController.logout as never);

    expect(body).toEqual({ success: true, message: "Logout successful", data: null });
  });
});

describe("verifyAccessToken", () => {
  const sign = (payload: object, secret = env.JWT_SECRET, options: jwt.SignOptions = {}) =>
    jwt.sign(payload, secret, options);

  test("AU-16 returns the identity from a valid token", () => {
    expect(verifyAccessToken(sign({ sub: ID.user, role: "tutor" }))).toEqual({
      id: ID.user,
      role: "tutor",
    });
  });

  test.each([
    ["signed with another secret", () => sign({ sub: ID.user, role: "tutor" }, "other-secret")],
    ["expired", () => sign({ sub: ID.user, role: "tutor" }, undefined, { expiresIn: -1 })],
    ["with a non-UUID subject", () => sign({ sub: "1", role: "tutor" })],
    ["with an unknown role", () => sign({ sub: ID.user, role: "admin" })],
    ["that is garbage", () => "garbage"],
  ])("AU-17 rejects a token %s with 401", (_label, token) => {
    expect(() => verifyAccessToken(token())).toThrow(
      new UnauthorizedError("Invalid or expired token")
    );
  });
});

describe("authMiddleware", () => {
  test("AU-18 sets req.user from a valid bearer token", async () => {
    const token = jwt.sign({ sub: ID.user, role: "student" }, env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;

    const next = await runMiddleware(authMiddleware, req);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: ID.user, role: "student" });
  });

  test.each([
    ["no header", {}],
    ["a non-bearer header", { authorization: "Basic abc" }],
  ])("AU-19 rejects %s as a missing token", async (_label, headers) => {
    const next = await runMiddleware(authMiddleware, { headers });

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 401,
      message: "Authentication token is missing",
    });
  });

  test("AU-20 rejects an invalid token", async () => {
    const next = await runMiddleware(authMiddleware, {
      headers: { authorization: "Bearer nope" },
    });

    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireRole", () => {
  test("AU-21 lets an allowed role through", async () => {
    const next = await runMiddleware(requireRole("student", "tutor"), {
      user: { id: ID.user, role: "tutor" },
    });

    expect(next).toHaveBeenCalledWith();
  });

  test("AU-22 blocks another role with 403 naming who is allowed", async () => {
    const next = await runMiddleware(requireRole("student"), {
      user: { id: ID.user, role: "tutor" },
    });

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(next.mock.calls[0][0]).toMatchObject({
      message: "Only student can access this resource",
    });
  });

  test("AU-23 fails with 401 when no user is set", async () => {
    const next = await runMiddleware(requireRole("student"), {});

    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireActiveAccount", () => {
  const req = { user: { id: ID.user, role: "tutor" } };

  test("AU-24 lets an active account through", async () => {
    jest
      .spyOn(authRepository, "findAccountStatusById")
      .mockResolvedValue({ id: ID.user, accountStatus: "ACTIVE" });

    const next = await runMiddleware(requireActiveAccount, req);

    expect(next).toHaveBeenCalledWith();
  });

  test("AU-25 blocks an inactive account with 403", async () => {
    jest
      .spyOn(authRepository, "findAccountStatusById")
      .mockResolvedValue({ id: ID.user, accountStatus: "INACTIVE" });

    const next = await runMiddleware(requireActiveAccount, req);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  test("AU-26 rejects a deleted account with 401", async () => {
    jest.spyOn(authRepository, "findAccountStatusById").mockResolvedValue(null);

    const next = await runMiddleware(requireActiveAccount, req);

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  test("AU-27 rejects a request with no user", async () => {
    const next = await runMiddleware(requireActiveAccount, {});

    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});

describe("errorHandler", () => {
  function handle(error: unknown) {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    errorHandler(error, {} as never, res as never, jest.fn());
    return res;
  }

  test("AU-28 uses an AppError's status and message", () => {
    const res = handle(new NotFoundError("Missing"));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Missing" });
  });

  test("AU-29 answers 400 for validation errors, joining the messages", () => {
    const res = handle(
      new ZodError([
        { code: "custom", message: "First", path: [] },
        { code: "custom", message: "Second", path: [] },
      ])
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "First, Second" });
  });

  test("AU-30 answers 400 for a malformed JSON body", () => {
    const res = handle(Object.assign(new SyntaxError("bad"), { body: "{" }));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid request body" });
  });

  test("AU-31 hides unknown errors behind a generic 500", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const res = handle(new Error("secret database details"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Internal server error" });
  });
});
