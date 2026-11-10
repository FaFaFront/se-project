import { EventEmitter } from "node:events";
import { expect, test } from "@jest/globals";
import type { Redis } from "ioredis";
import { observeRedisPublishFailures } from "../src/config/redis-publisher.js";

test("observes a rejected publish even when the adapter ignores its promise", async () => {
  const publisher = Object.assign(new EventEmitter(), {
    publish: () => Promise.reject(new Error("Redis is unavailable")),
  }) as unknown as Redis;
  let failures = 0;

  observeRedisPublishFailures(publisher, () => {
    failures += 1;
  });

  void publisher.publish("conversation", "message");
  await new Promise<void>((resolve) => setImmediate(resolve));

  expect(failures).toBe(1);
});

test("preserves publish results for callers that await them", async () => {
  const failure = new Error("Redis is unavailable");
  const publisher = Object.assign(new EventEmitter(), {
    publish: (channel: string) =>
      channel === "available" ? Promise.resolve(2) : Promise.reject(failure),
  }) as unknown as Redis;
  let failures = 0;

  observeRedisPublishFailures(publisher, () => {
    failures += 1;
  });

  expect(await publisher.publish("available", "message")).toBe(2);
  await expect(publisher.publish("unavailable", "message")).rejects.toBe(failure);
  expect(failures).toBe(1);
});

test("reconnects once after a publish failure and permits recovery on ready", async () => {
  let shouldFail = true;
  let reconnects = 0;
  const publisher = Object.assign(new EventEmitter(), {
    status: "ready",
    publish: () => (shouldFail ? Promise.reject(new Error("publish failed")) : Promise.resolve(1)),
    disconnect(reconnect: boolean) {
      expect(reconnect).toBe(true);
      reconnects += 1;
      publisher.status = "reconnecting";
    },
  }) as unknown as Redis;
  let failures = 0;
  observeRedisPublishFailures(publisher, () => {
    failures += 1;
  });

  void publisher.publish("conversation", "first");
  void publisher.publish("conversation", "second");
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(failures).toBe(2);
  expect(reconnects).toBe(1);

  publisher.status = "ready";
  publisher.emit("ready");
  shouldFail = false;
  expect(await publisher.publish("conversation", "third")).toBe(1);
  expect(reconnects).toBe(1);

  shouldFail = true;
  void publisher.publish("conversation", "fourth");
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(reconnects).toBe(2);
});
