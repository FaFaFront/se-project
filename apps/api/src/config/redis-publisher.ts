import type { Redis } from "ioredis";

// The Socket.IO Redis adapter does not await the promises returned by publish().
// Observe rejections without changing the result for callers that do await them.
export function observeRedisPublishFailures(publisher: Redis, onFailure: () => void): void {
  const publish = publisher.publish.bind(publisher);

  publisher.publish = (...args: Parameters<Redis["publish"]>) => {
    const pending = publish(...args);
    void pending.catch(onFailure);
    return pending;
  };
}
