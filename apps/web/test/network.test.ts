import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ApiError, apiClient } from "@/lib/api-client";
import { saveSession } from "@/lib/auth-storage";
import { MAX_IMAGE_SIZE_BYTES, uploadImageToGCS } from "@/lib/upload";
import { installLocalStorage, removeWindow } from "./helpers";

type FetchCall = [string, RequestInit];
const fetchMock = jest.fn<(url: string, init?: RequestInit) => Promise<unknown>>();

function reply(status: number, body: unknown) {
  return { status, ok: status < 400, statusText: "", json: async () => body };
}

beforeEach(() => {
  globalThis.fetch = fetchMock as never;
  installLocalStorage();
});

afterEach(() => {
  fetchMock.mockReset();
  removeWindow();
});

describe("apiClient", () => {
  test("WN-01 unwraps data from a success envelope", async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, message: "ok", data: { id: 1 } }));

    expect(await apiClient.get("/x")).toEqual({ id: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:4000/api/x");
  });

  test("WN-02 a failure envelope throws ApiError with the API message and status", async () => {
    fetchMock.mockResolvedValue(reply(409, { success: false, message: "Already exists" }));

    const error = await apiClient.post("/x", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Already exists", status: 409 });
  });

  test("WN-03 sends the bearer token only when signed in", async () => {
    fetchMock.mockResolvedValue(reply(200, { success: true, message: "", data: null }));

    await apiClient.get("/a");
    saveSession({ token: "tok", user: {} } as never);
    await apiClient.get("/b");

    const [, first] = fetchMock.mock.calls[0] as FetchCall;
    const [, second] = fetchMock.mock.calls[1] as FetchCall;
    expect(first.headers).not.toHaveProperty("Authorization");
    expect(second.headers).toMatchObject({ Authorization: "Bearer tok" });
  });

  test.each([
    ["post", "POST"],
    ["put", "PUT"],
    ["patch", "PATCH"],
  ] as const)("WN-04 %s sends JSON with method %s", async (method, verb) => {
    fetchMock.mockResolvedValue(reply(200, { success: true, message: "", data: null }));

    await apiClient[method]("/x", { a: 1 });

    const [, init] = fetchMock.mock.calls[0] as FetchCall;
    expect(init).toMatchObject({ method: verb, body: '{"a":1}' });
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });
});

describe("uploadImageToGCS", () => {
  const file = (type: string, size = 100) => ({ type, size }) as File;

  test("WN-05 gets a presigned URL, PUTs the file without cookies, returns the public URL", async () => {
    fetchMock
      .mockResolvedValueOnce(
        reply(200, {
          success: true,
          message: "",
          data: { key: "k", url: "https://put", publicUrl: "https://pub" },
        })
      )
      .mockResolvedValueOnce(reply(200, {}));
    const image = file("image/png", 2048);

    expect(await uploadImageToGCS(image)).toBe("https://pub");
    const [, presign] = fetchMock.mock.calls[0] as FetchCall;
    expect(JSON.parse(presign.body as string)).toEqual({
      contentType: "image/png",
      contentLength: 2048,
      folder: "avatars",
    });
    expect(fetchMock.mock.calls[1]).toEqual([
      "https://put",
      { method: "PUT", headers: { "Content-Type": "image/png" }, body: image, credentials: "omit" },
    ]);
  });

  test("WN-06 rejects a wrong type or an oversize file before any request", async () => {
    await expect(uploadImageToGCS(file("image/svg+xml"))).rejects.toThrow("Invalid file type");
    await expect(uploadImageToGCS(file("image/png", MAX_IMAGE_SIZE_BYTES + 1))).rejects.toThrow(
      "10 MB"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("WN-07 a failed storage PUT reports its status", async () => {
    fetchMock
      .mockResolvedValueOnce(
        reply(200, { success: true, message: "", data: { url: "u", publicUrl: "p" } })
      )
      .mockResolvedValueOnce({ ...reply(403, {}), statusText: "Forbidden" });

    await expect(uploadImageToGCS(file("image/png"))).rejects.toThrow("(403 Forbidden)");
  });

  test("WN-08 a network TypeError from fetch is explained as a CORS problem", async () => {
    fetchMock
      .mockResolvedValueOnce(
        reply(200, { success: true, message: "", data: { url: "u", publicUrl: "p" } })
      )
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(uploadImageToGCS(file("image/png"))).rejects.toThrow("CORS");
  });
});
