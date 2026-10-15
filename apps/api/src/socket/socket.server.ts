import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { socketAuthMiddleware } from "./middleware/socket-auth.middleware.js";
import type { AppSocketServer } from "./socket.types.js";

export function createSocketServer(httpServer: HttpServer): AppSocketServer {
  const io: AppSocketServer = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ["websocket"],
  });

  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => registerConnectionHandlers(io, socket));

  return io;
}
