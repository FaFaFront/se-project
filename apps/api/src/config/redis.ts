import { Redis } from "ioredis";
import { env } from "./env.js";
import { observeRedisPublishFailures } from "./redis-publisher.js";

export type RedisClients = {
  publisher: Redis;
  subscriber: Redis;
  isReady: () => boolean;
};

export function createRedisClients(): RedisClients | null {
  const redisUrl = env.REDIS_URL.trim();
  const requiresRedis = env.NODE_ENV === "production" || process.env.VERCEL === "1";

  if (!redisUrl) {
    if (requiresRedis) {
      throw new Error(
        "REDIS_URL is required in production and on Vercel for shared Socket.IO rooms"
      );
    }
    console.warn("REDIS_URL is unset; using the in-memory Socket.IO adapter for local development");
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(redisUrl);
  } catch {
    throw new Error("REDIS_URL must be a native redis:// or rediss:// connection URL");
  }
  if (!["redis:", "rediss:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    throw new Error("REDIS_URL must be a native redis:// or rediss:// connection URL");
  }
  if (requiresRedis && (parsedUrl.protocol !== "rediss:" || !parsedUrl.password)) {
    throw new Error("Production Redis requires a rediss:// connection URL with authentication");
  }

  const retryStrategy = (attempt: number) => Math.min(attempt * 200, 5000);
  // Chat history lives in PostgreSQL, so stale Pub/Sub packets should fail
  // promptly instead of waiting in memory or replaying after reconnection.
  const publisher = new Redis(redisUrl, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    autoResendUnfulfilledCommands: false,
    socketTimeout: 10000,
    retryStrategy,
  });
  // The adapter subscribes before Redis is ready; keep that small, fixed set of
  // subscription commands queued and let ioredis restore them on reconnect.
  const subscriber = new Redis(redisUrl, {
    enableOfflineQueue: true,
    maxRetriesPerRequest: null,
    autoResendUnfulfilledCommands: true,
    retryStrategy,
  });

  let publisherHealthy = false;
  let subscriberHealthy = false;
  let publishFailureLogged = false;
  publisher.on("ready", () => {
    publisherHealthy = true;
    publishFailureLogged = false;
  });
  observeRedisPublishFailures(publisher, () => {
    publisherHealthy = false;
    if (publishFailureLogged) return;
    publishFailureLogged = true;
    console.error("Redis publish failed; cross-instance chat delivery is unavailable");
  });

  publisher.on("error", () => {
    publisherHealthy = false;
    console.error("Redis publisher connection error");
  });
  publisher.on("close", () => {
    publisherHealthy = false;
  });
  subscriber.on("ready", () => {
    subscriberHealthy = true;
  });
  subscriber.on("error", () => {
    subscriberHealthy = false;
    console.error("Redis subscriber connection error");
  });
  subscriber.on("close", () => {
    subscriberHealthy = false;
  });

  return {
    publisher,
    subscriber,
    isReady: () => publisherHealthy && subscriberHealthy,
  };
}
