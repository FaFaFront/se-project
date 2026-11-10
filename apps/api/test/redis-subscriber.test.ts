import { EventEmitter } from "node:events";
import { expect, test } from "@jest/globals";
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

    await expect(subscriptions.waitForInitialSubscriptions(100)).rejects.toBe(failure);
    expect(subscriptions.isReady()).toBe(false);
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

  await expect(subscriptions.waitForInitialSubscriptions(20)).rejects.toThrow(/timed out|timeout/i);
  expect(subscriptions.isReady()).toBe(false);
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
  expect(subscriptions.isReady()).toBe(true);

  subscriber.emit("close");
  expect(subscriptions.isReady()).toBe(false);

  reconnecting = true;
  startAdapterSubscriptions(subscriber);
  subscriber.emit("ready");
  expect(subscriptions.isReady()).toBe(false);

  resolvePattern(1);
  resolveChannels(2);
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(subscriptions.isReady()).toBe(true);
});
