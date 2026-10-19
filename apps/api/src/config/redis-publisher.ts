import type { Redis } from "ioredis";

// The Socket.IO Redis adapter does not await the promises returned by publish().
// Observe rejections without changing the result for callers that do await them.
export function observeRedisPublishFailures(publisher: Redis, onFailure: () => void): void {
  const publish = publisher.publish.bind(publisher);
  let reconnectingAfterFailure = false;

  publisher.on("ready", () => {
    reconnectingAfterFailure = false;
  });

  publisher.publish = (...args: Parameters<Redis["publish"]>) => {
    const pending = publish(...args);
    void pending.catch(() => {
      onFailure();
      // A command can fail while the TCP connection remains "ready". Force one
      // reconnect so the ready event can restore health after Redis recovers.
      if (!reconnectingAfterFailure && publisher.status === "ready") {
        reconnectingAfterFailure = true;
        publisher.disconnect(true);
      }
    });
    return pending;
  };
}
