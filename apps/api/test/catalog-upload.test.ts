import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ZodError } from "zod";

const getSignedUrl = jest.fn(async (_options: Record<string, unknown>) => [
  "https://signed.example/put",
]);
const file = jest.fn((_key: string) => ({ getSignedUrl }));
const bucket = jest.fn((_name: string) => ({ file }));
const Storage = jest.fn((_options: Record<string, unknown>) => ({ bucket }));
jest.mock("@google-cloud/storage", () => ({ Storage }));

import { UnauthorizedError } from "../src/common/errors/app-error.js";
import { env } from "../src/config/env.js";
import { subjectController } from "../src/controller/subject.controller.js";
import { tutorController } from "../src/controller/tutor.controller.js";
import { uploadController } from "../src/controller/upload.controller.js";
import { subjectRepository } from "../src/repository/subject.repository.js";
import { getExtension, getPublicUrl, getSignedUploadUrl } from "../src/service/upload.service.js";
import { tutorService } from "../src/service/tutor.service.js";
import { callController, fakePrisma, ID, restorePrisma } from "./helpers.js";

const gcsKeys = [
  "GCS_BUCKET",
  "GCS_PUBLIC_BASE_URL",
  "GCS_SERVICE_ACCOUNT_KEY",
  "GCS_CREDENTIALS_PATH",
  "GCS_PROJECT_ID",
] as const;
const savedEnv = Object.fromEntries(gcsKeys.map((key) => [key, env[key]]));

beforeEach(() => {
  Object.assign(env, Object.fromEntries(gcsKeys.map((key) => [key, ""])), {
    GCS_BUCKET: "test-bucket",
  });
});

afterEach(() => {
  Object.assign(env, savedEnv);
  jest.restoreAllMocks();
  jest.clearAllMocks();
  restorePrisma();
});

describe("tutorController", () => {
  test("TC-01 listTutors coerces prices and drops empty filters", async () => {
    const list = jest.spyOn(tutorService, "listTutors").mockResolvedValue([]);

    const { res } = await callController(tutorController.listTutors, {
      query: {
        search: "  ",
        subjectId: "",
        minPrice: "100",
        maxPrice: "",
        sortBy: "price",
        order: "asc",
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(list.mock.calls[0][0]).toEqual({ minPrice: 100, sortBy: "price", order: "asc" });
  });

  test.each([
    ["min above max", { minPrice: "500", maxPrice: "100" }, "must not exceed"],
    ["a negative price", { minPrice: "-1" }, "must not be negative"],
    ["a text price", { maxPrice: "cheap" }, "must be a number"],
    ["an unknown sort", { sortBy: "name" }, "Sort must be one of"],
    ["an unknown order", { order: "up" }, "Order must be"],
    ["a bad subject id", { subjectId: "math" }, "valid UUID"],
  ])("TC-02 listTutors rejects %s", async (_label, query, message) => {
    const list = jest.spyOn(tutorService, "listTutors");

    const { error } = await callController(tutorController.listTutors, { query });

    expect(error).toBeInstanceOf(ZodError);
    expect(error?.message).toContain(message);
    expect(list).not.toHaveBeenCalled();
  });

  test("TC-03 equal min and max price is allowed", async () => {
    jest.spyOn(tutorService, "listTutors").mockResolvedValue([]);

    const { error } = await callController(tutorController.listTutors, {
      query: { minPrice: "200", maxPrice: "200" },
    });

    expect(error).toBeUndefined();
  });

  test("TC-04 getTutor validates the id and returns the tutor", async () => {
    jest.spyOn(tutorService, "getTutor").mockResolvedValue({ id: ID.tutor } as never);

    const bad = await callController(tutorController.getTutor, { params: { tutorId: "1" } });
    const good = await callController(tutorController.getTutor, { params: { tutorId: ID.tutor } });

    expect(bad.error).toBeInstanceOf(ZodError);
    expect(good.body).toMatchObject({ success: true, data: { id: ID.tutor } });
  });
});

describe("subjects", () => {
  test("SU-01 lists subjects sorted by name", async () => {
    const findMany = jest.fn(async (_args: object) => [{ id: ID.subject, name: "Math" }]);
    fakePrisma({ subject: { findMany } });

    const { body } = await callController(subjectController.getAllSubjects);

    expect(findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
    expect(body).toMatchObject({ success: true, data: [{ id: ID.subject, name: "Math" }] });
  });

  test("SU-02 a database failure goes to the error handler", async () => {
    const failure = new Error("down");
    jest.spyOn(subjectRepository, "findAll").mockRejectedValue(failure);

    const { error } = await callController(subjectController.getAllSubjects);

    expect(error).toBe(failure);
  });

  test("SU-03 findByIds skips the database for an empty list", async () => {
    const findMany = jest.fn(async () => []);
    fakePrisma({ subject: { findMany } });

    expect(await subjectRepository.findByIds([])).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("gcs.service", () => {
  test.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["application/pdf", "jpg"],
  ])("UP-01 %s gets extension %s", (type, ext) => {
    expect(getExtension(type)).toBe(ext);
  });

  test("UP-02 public URL uses the custom base URL without a double slash", () => {
    Object.assign(env, { GCS_PUBLIC_BASE_URL: "https://cdn.example.com/" });

    expect(getPublicUrl("users/a/b.png")).toBe("https://cdn.example.com/users/a/b.png");
  });

  test("UP-03 public URL falls back to the bucket URL, and needs a bucket", () => {
    expect(getPublicUrl("k.png")).toBe("https://storage.googleapis.com/test-bucket/k.png");

    Object.assign(env, { GCS_BUCKET: "" });
    expect(() => getPublicUrl("k.png")).toThrow("GOOGLE_STORAGE_BUCKET");
  });

  test("UP-04 signed URL is a v4 write URL that locks the content type and length", async () => {
    const before = Date.now();

    const url = await getSignedUploadUrl("users/a/b.png", "image/png", 900, 1234);

    expect(url).toBe("https://signed.example/put");
    expect(bucket).toHaveBeenCalledWith("test-bucket");
    expect(file).toHaveBeenCalledWith("users/a/b.png");
    const options = getSignedUrl.mock.calls[0][0] as { expires: number };
    expect(options).toMatchObject({
      version: "v4",
      action: "write",
      contentType: "image/png",
      extensionHeaders: { "Content-Length": "1234" },
    });
    expect(options.expires).toBeGreaterThanOrEqual(before + 900_000);
  });

  test("UP-05 signed URL without a length sends no extension headers", async () => {
    await getSignedUploadUrl("k", "image/png");

    expect(getSignedUrl.mock.calls[0][0]).not.toHaveProperty("extensionHeaders");
  });

  test("UP-06 signed URL without a bucket fails", async () => {
    Object.assign(env, { GCS_BUCKET: "" });

    await expect(getSignedUploadUrl("k", "image/png")).rejects.toThrow("GOOGLE_STORAGE_BUCKET");
  });
});

describe("uploadController.getUploadUrl", () => {
  const user = { id: ID.user, role: "student" };

  test("UP-07 the key is always under the signed-in user's folder", async () => {
    const { body } = await callController(uploadController.getUploadUrl, {
      user,
      body: { contentType: "image/png", contentLength: 2048, folder: "avatars" },
    });

    const data = body.data as { key: string; url: string; publicUrl: string };
    expect(data.key).toMatch(new RegExp(`^users/${ID.user}/avatars/[0-9a-f-]{36}\\.png$`));
    expect(data.publicUrl).toBe(`https://storage.googleapis.com/test-bucket/${data.key}`);
    expect(data.url).toBe("https://signed.example/put");
  });

  test("UP-08 without a folder the key sits directly under the user", async () => {
    const { body } = await callController(uploadController.getUploadUrl, {
      user,
      body: { contentType: "image/jpeg", contentLength: 1 },
    });

    expect((body.data as { key: string }).key).toMatch(
      new RegExp(`^users/${ID.user}/[0-9a-f-]{36}\\.jpg$`)
    );
  });

  test.each([
    ["a PDF", { contentType: "application/pdf", contentLength: 1 }, "Invalid file type"],
    [
      "a file over 10 MiB",
      { contentType: "image/png", contentLength: 10 * 1024 * 1024 + 1 },
      "10 MiB",
    ],
    ["a zero length", { contentType: "image/png", contentLength: 0 }, "positive"],
    [
      "a path traversal folder",
      { contentType: "image/png", contentLength: 1, folder: "../admin" },
      "alphanumeric",
    ],
    [
      "a slash in the folder",
      { contentType: "image/png", contentLength: 1, folder: "a/b" },
      "alphanumeric",
    ],
    [
      "an extra field",
      { contentType: "image/png", contentLength: 1, key: "users/x/y.png" },
      "Unrecognized key",
    ],
  ])("UP-09 rejects %s", async (_label, body, message) => {
    const { error } = await callController(uploadController.getUploadUrl, { user, body });

    expect(error).toBeInstanceOf(ZodError);
    expect(error?.message).toContain(message);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  test("UP-10 without a user is 401", async () => {
    const { error } = await callController(uploadController.getUploadUrl, {});

    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  test("UP-11 storage client is built once from the inline service-account key", async () => {
    // A fresh module copy so the cached client from earlier tests doesn't hide the constructor call.
    await jest.isolateModulesAsync(async () => {
      const isolatedEnv = (await import("../src/config/env.js")).env;
      Object.assign(isolatedEnv, { GCS_BUCKET: "test-bucket" });
      Object.assign(isolatedEnv, { GCS_SERVICE_ACCOUNT_KEY: '{"client_email":"a@b"}' });
      const gcs = await import("../src/service/upload.service.js");

      await gcs.getSignedUploadUrl("k", "image/png");
      await gcs.getSignedUploadUrl("k", "image/png");

      expect(Storage).toHaveBeenCalledTimes(1);
      expect(Storage.mock.calls[0][0]).toMatchObject({ credentials: { client_email: "a@b" } });
    });
  });

  test("UP-12 a malformed inline key fails with a clear message", async () => {
    await jest.isolateModulesAsync(async () => {
      const isolatedEnv = (await import("../src/config/env.js")).env;
      Object.assign(isolatedEnv, { GCS_BUCKET: "test-bucket" });
      Object.assign(isolatedEnv, { GCS_SERVICE_ACCOUNT_KEY: "{not json" });
      const gcs = await import("../src/service/upload.service.js");

      await expect(gcs.getSignedUploadUrl("k", "image/png")).rejects.toThrow(
        "Failed to parse GOOGLE_STORAGE_SERVICE_ACCOUNT_KEY"
      );
    });
  });
});
