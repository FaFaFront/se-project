import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import type { Redis } from "ioredis";
import { observeRedisSubscriptions } from "../src/config/redis-subscriber.js";

function createSubscriber(options: {
  psubscribe: () => Promise<number>;
  subscribe: () => Promise<number>;
}): Redis {
  return Object.assign(new EventEmitter(), {
    status: "ready",
    psubscribe: options.psubscribe,
    subscribe: options.subscribe,
  }) as unknown as Redis;
}

function startAdapterSubscriptions(subscriber: Redis): void {
  void subscriber.psubscribe("tutorist:socket.io#/#*");
  void subscriber.subscribe("tutorist:socket.io-request#/#", "tutorist:socket.io-response#/#");
}

for (const failingCommand of ["psubscribe", "subscribe"] as const) {
  test(`rejects startup when adapter ${failingCommand} fails`, async () => {
    const failure = new Error(`Redis denied ${failingCommand}`);
    const subscriber = createSubscriber({
      psubscribe: () =>
        failingCommand === "psubscribe" ? Promise.reject(failure) : Promise.resolve(1),
      subscribe: () =>
        failingCommand === "subscribe" ? Promise.reject(failure) : Promise.resolve(2),
    });
    const subscriptions = observeRedisSubscriptions(subscriber);

    startAdapterSubscriptions(subscriber);

    await assert.rejects(subscriptions.waitForInitialSubscriptions(100), failure);
    assert.equal(subscriptions.isReady(), false);
  });
}

test("bounds startup when Redis never acknowledges subscriptions", async () => {
  const pending = new Promise<number>(() => undefined);
  const subscriber = createSubscriber({
    psubscribe: () => pending,
    subscribe: () => pending,
  });
  const subscriptions = observeRedisSubscriptions(subscriber);

  startAdapterSubscriptions(subscriber);

  await assert.rejects(subscriptions.waitForInitialSubscriptions(20), /timed out|timeout/i);
  assert.equal(subscriptions.isReady(), false);
});

test("marks subscriptions healthy again only after reconnect subscriptions succeed", async () => {
  let reconnecting = false;
  let resolvePattern!: (value: number) => void;
  let resolveChannels!: (value: number) => void;
  const patternRestored = new Promise<number>((resolve) => {
    resolvePattern = resolve;
  });
  const channelsRestored = new Promise<number>((resolve) => {
    resolveChannels = resolve;
  });
  const subscriber = createSubscriber({
    psubscribe: () => (reconnecting ? patternRestored : Promise.resolve(1)),
    subscribe: () => (reconnecting ? channelsRestored : Promise.resolve(2)),
  });
  const subscriptions = observeRedisSubscriptions(subscriber);

  startAdapterSubscriptions(subscriber);
  subscriber.emit("ready");
  await subscriptions.waitForInitialSubscriptions(100);
  assert.equal(subscriptions.isReady(), true);

  subscriber.emit("close");
  assert.equal(subscriptions.isReady(), false);

  reconnecting = true;
  startAdapterSubscriptions(subscriber);
  subscriber.emit("ready");
  assert.equal(subscriptions.isReady(), false);

  resolvePattern(1);
  resolveChannels(2);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(subscriptions.isReady(), true);
});
