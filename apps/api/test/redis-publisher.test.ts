import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
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

  assert.equal(failures, 1);
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

  assert.equal(await publisher.publish("available", "message"), 2);
  await assert.rejects(publisher.publish("unavailable", "message"), failure);
  assert.equal(failures, 1);
});

test("reconnects once after a publish failure and permits recovery on ready", async () => {
  let shouldFail = true;
  let reconnects = 0;
  const publisher = Object.assign(new EventEmitter(), {
    status: "ready",
    publish: () => (shouldFail ? Promise.reject(new Error("publish failed")) : Promise.resolve(1)),
    disconnect(reconnect: boolean) {
      assert.equal(reconnect, true);
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
  assert.equal(failures, 2);
  assert.equal(reconnects, 1);

  publisher.status = "ready";
  publisher.emit("ready");
  shouldFail = false;
  assert.equal(await publisher.publish("conversation", "third"), 1);
  assert.equal(reconnects, 1);

  shouldFail = true;
  void publisher.publish("conversation", "fourth");
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(reconnects, 2);
});
