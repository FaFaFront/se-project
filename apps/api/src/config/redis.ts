import { Redis } from "ioredis";
import { env } from "./env.js";

export type RedisClients = {
  publisher: Redis;
  subscriber: Redis;
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

  const publisher = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
  });
  const subscriber = publisher.duplicate();

  publisher.on("error", () => console.error("Redis publisher connection error"));
  subscriber.on("error", () => console.error("Redis subscriber connection error"));

  return { publisher, subscriber };
}
