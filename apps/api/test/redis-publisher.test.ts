import assert from "node:assert/strict";
import { test } from "node:test";
import type { Redis } from "ioredis";
import { observeRedisPublishFailures } from "../src/config/redis-publisher.js";

test("observes a rejected publish even when the adapter ignores its promise", async () => {
  const publisher = {
    publish: () => Promise.reject(new Error("Redis is unavailable")),
  } as unknown as Redis;
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
  const publisher = {
    publish: (channel: string) =>
      channel === "available" ? Promise.resolve(2) : Promise.reject(failure),
  } as unknown as Redis;
  let failures = 0;

  observeRedisPublishFailures(publisher, () => {
    failures += 1;
  });

  assert.equal(await publisher.publish("available", "message"), 2);
  await assert.rejects(publisher.publish("unavailable", "message"), failure);
  assert.equal(failures, 1);
});
