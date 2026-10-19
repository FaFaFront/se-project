import type { Redis } from "ioredis";

const SUBSCRIPTION_TIMEOUT_MS = 10000;

// The Redis adapter ignores the promises returned by ioredis subscription
// commands, including the commands ioredis issues again after reconnecting.
export function observeRedisSubscriptions(subscriber: Redis): {
  isReady: () => boolean;
  waitForInitialSubscriptions: (timeoutMs?: number) => Promise<void>;
} {
  const initialSubscriptions: Promise<unknown>[] = [];
  let collectingInitial = true;
  let pendingSubscriptions = 0;
  let connected = false;
  let subscriptionFailed = false;

  subscriber.on("ready", () => {
    connected = true;
    subscriptionFailed = false;
  });
  subscriber.on("error", () => {
    connected = false;
  });
  subscriber.on("close", () => {
    connected = false;
  });

  function observe<T>(pending: Promise<T>): Promise<T> {
    if (collectingInitial) initialSubscriptions.push(pending);
    pendingSubscriptions += 1;
    void pending.then(
      () => {
        pendingSubscriptions -= 1;
      },
      () => {
        pendingSubscriptions -= 1;
        subscriptionFailed = true;
        console.error("Redis subscriber subscription failed");
      }
    );
    return pending;
  }

  const subscribe = subscriber.subscribe.bind(subscriber);
  subscriber.subscribe = ((...args: Parameters<Redis["subscribe"]>) =>
    observe(subscribe(...args))) as Redis["subscribe"];
  const psubscribe = subscriber.psubscribe.bind(subscriber);
  subscriber.psubscribe = ((...args: Parameters<Redis["psubscribe"]>) =>
    observe(psubscribe(...args))) as Redis["psubscribe"];

  async function waitForInitialSubscriptions(timeoutMs = SUBSCRIPTION_TIMEOUT_MS): Promise<void> {
    collectingInitial = false;
    if (initialSubscriptions.length !== 2) {
      throw new Error("Redis adapter did not start both subscriptions");
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.all(initialSubscriptions),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Redis subscription setup timed out")),
            timeoutMs
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    isReady: () => connected && pendingSubscriptions === 0 && !subscriptionFailed,
    waitForInitialSubscriptions,
  };
}
