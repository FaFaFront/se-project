import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";

type FakeRedis = EventEmitter & {
  url: string;
  options: Record<string, unknown>;
  rawPublish: jest.Mock<() => Promise<number>>;
};
const instances: FakeRedis[] = [];
jest.mock("ioredis", () => ({
  Redis: function (url: string, options: Record<string, unknown>) {
    // redis.ts wraps `publish`, so tests reach the original mock through `rawPublish`.
    const rawPublish = jest.fn(async () => 1);
    const client = Object.assign(new EventEmitter(), {
      url,
      options,
      status: "connecting",
      publish: rawPublish,
      rawPublish,
      psubscribe: jest.fn(async () => 1),
      subscribe: jest.fn(async () => 1),
      disconnect: jest.fn(),
    });
    instances.push(client as unknown as FakeRedis);
    return client;
  },
}));

import { env } from "../src/config/env.js";
import { createRedisClients } from "../src/config/redis.js";

const savedEnv = { NODE_ENV: env.NODE_ENV, REDIS_URL: env.REDIS_URL };
const savedProcessEnv = { ...process.env };

function setRedis(url: string, nodeEnv = "development") {
  Object.assign(env, { REDIS_URL: url, NODE_ENV: nodeEnv });
}

beforeEach(() => {
  instances.length = 0;
  delete process.env.VERCEL;
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  Object.assign(env, savedEnv);
  process.env = { ...savedProcessEnv };
  jest.restoreAllMocks();
});

/** Loads a fresh env.ts with dotenv disabled, so the developer's apps/api/.env can't refill values. */
async function loadFreshEnv() {
  let loaded: Promise<{ env: typeof env }> | undefined;
  await jest.isolateModulesAsync(async () => {
    jest.doMock("dotenv/config", () => ({}));
    loaded = import("../src/config/env.js");
    await loaded.catch(() => {});
  });
  return loaded!;
}

describe("env", () => {
  test.each(["DATABASE_URL", "JWT_SECRET"])("CF-01 a missing %s stops startup", async (key) => {
    delete process.env[key];

    await expect(loadFreshEnv()).rejects.toThrow(`Missing required env: ${key}`);
  });

  test("CF-02 optional values fall back to their defaults", async () => {
    delete process.env.PORT;
    delete process.env.CORS_ORIGIN;
    delete process.env.NODE_ENV;

    const fresh = await loadFreshEnv();

    expect(fresh.env).toMatchObject({
      PORT: "4000",
      CORS_ORIGIN: "http://localhost:3000",
      NODE_ENV: "development",
    });
  });
});

describe("createRedisClients", () => {
  test("CF-03 no REDIS_URL in development uses the in-memory adapter", () => {
    setRedis("  ");

    expect(createRedisClients()).toBeNull();
    expect(instances).toHaveLength(0);
  });

  test.each([
    ["in production", "production", undefined],
    ["on Vercel", "development", "1"],
  ])("CF-04 no REDIS_URL %s stops startup", (_label, nodeEnv, vercel) => {
    setRedis("", nodeEnv);
    if (vercel) process.env.VERCEL = vercel;

    expect(() => createRedisClients()).toThrow("REDIS_URL is required");
  });

  test.each(["not a url", "http://localhost:6379", "redis://"])(
    "CF-05 %j is rejected as a Redis URL",
    (url) => {
      setRedis(url);

      expect(() => createRedisClients()).toThrow("native redis:// or rediss://");
    }
  );

  test.each(["redis://:pw@host:6379", "rediss://host:6379"])(
    "CF-06 production refuses %j (needs TLS and a password)",
    (url) => {
      setRedis(url, "production");

      expect(() => createRedisClients()).toThrow("rediss:// connection URL with authentication");
    }
  );

  test("CF-07 production accepts rediss:// with a password", () => {
    setRedis("rediss://:secret@host:6380", "production");

    expect(createRedisClients()).not.toBeNull();
  });

  test("CF-08 the publisher fails fast while the subscriber queues and resends", () => {
    setRedis("redis://localhost:6379");

    createRedisClients();

    const [publisher, subscriber] = instances;
    expect(publisher.options).toMatchObject({ enableOfflineQueue: false, maxRetriesPerRequest: 0 });
    expect(subscriber.options).toMatchObject({
      enableOfflineQueue: true,
      maxRetriesPerRequest: null,
      autoResendUnfulfilledCommands: true,
    });
    const retry = publisher.options.retryStrategy as (attempt: number) => number;
    expect([retry(1), retry(10), retry(1000)]).toEqual([200, 2000, 5000]);
  });

  test("CF-09 isReady needs both connections up and follows publisher errors", () => {
    setRedis("redis://localhost:6379");
    const clients = createRedisClients()!;
    const [publisher, subscriber] = instances;

    expect(clients.isReady()).toBe(false);
    publisher.emit("ready");
    expect(clients.isReady()).toBe(false);
    subscriber.emit("ready");
    expect(clients.isReady()).toBe(true);
    publisher.emit("error", new Error("reset"));
    expect(clients.isReady()).toBe(false);
    publisher.emit("ready");
    expect(clients.isReady()).toBe(true);
    publisher.emit("close");
    expect(clients.isReady()).toBe(false);
  });

  test("CF-10 a failed publish marks chat unavailable and logs once", async () => {
    setRedis("redis://localhost:6379");
    const clients = createRedisClients()!;
    const [publisher, subscriber] = instances;
    publisher.emit("ready");
    subscriber.emit("ready");
    publisher.rawPublish.mockRejectedValue(new Error("down"));

    await clients.publisher.publish("a", "b").catch(() => {});
    await clients.publisher.publish("a", "b").catch(() => {});

    expect(clients.isReady()).toBe(false);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
