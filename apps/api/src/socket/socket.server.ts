import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../config/env.js";
import { createRedisClients } from "../config/redis.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { socketAuthMiddleware } from "./middleware/socket-auth.middleware.js";
import type { AppSocketServer } from "./socket.types.js";

export async function createSocketServer(httpServer: HttpServer): Promise<AppSocketServer> {
  const io: AppSocketServer = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ["websocket"],
  });

  const redis = createRedisClients();
  if (redis) {
    try {
      io.adapter(createAdapter(redis.publisher, redis.subscriber, { key: "tutorist:socket.io" }));
      await redis.waitForInitialSubscriptions();
    } catch {
      redis.publisher.disconnect();
      redis.subscriber.disconnect();
      throw new Error("Unable to initialize Socket.IO Redis subscriptions");
    }
  }

  const canBroadcast = () => !redis || redis.isReady();

  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => registerConnectionHandlers(io, socket, canBroadcast));

  return io;
}
