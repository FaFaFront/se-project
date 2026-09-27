import { AccountStatus } from "@prisma/client";
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { AppError, BadRequestError, UnauthorizedError } from "../common/errors/app-error.js";
import { env } from "../config/env.js";
import { authRepository } from "../repository/auth.repository.js";
import { conversationService } from "../service/conversation.service.js";

const CHAT_PATH = /^\/ws\/conversations\/([^/]+)$/;
const MAX_MESSAGE_BYTES = 16 * 1024;

const sendMessageSchema = z
  .object({
    type: z.literal("message:send"),
    text: z.string().trim().min(1, "Message cannot be empty").max(4000),
  })
  .strict();
const conversationIdSchema = z.string().uuid();

type SocketErrorCode = "BAD_REQUEST" | "FORBIDDEN" | "INTERNAL_ERROR";

type JwtPayload = {
  sub: string;
};

const rooms = new Map<string, Set<WebSocket>>();

function writeUpgradeError(socket: Duplex, statusCode: number, message: string) {
  const statusTextByCode: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
  };
  const statusText = statusTextByCode[statusCode] ?? "Error";
  const body = JSON.stringify({ success: false, message });

  socket.write(
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
      "Content-Type: application/json\r\n" +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      "Connection: close\r\n" +
      "\r\n" +
      body
  );
  socket.destroy();
}

function getToken(request: IncomingMessage, url: URL) {
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  const authorization = request.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  return null;
}

async function authenticate(request: IncomingMessage, url: URL) {
  const token = getToken(request, url);
  if (!token) throw new UnauthorizedError("Authentication token is missing");

  let payload: JwtPayload;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || typeof decoded.sub !== "string") {
      throw new Error("Invalid token payload");
    }
    payload = { sub: decoded.sub };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const account = await authRepository.findAccountStatusById(payload.sub);
  if (!account) throw new UnauthorizedError("Authenticated user no longer exists");
  if (account.accountStatus === AccountStatus.INACTIVE) {
    throw new AppError("This account is inactive", 403);
  }

  return payload.sub;
}

function sendJson(socket: WebSocket, payload: object) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
}

function sendError(socket: WebSocket, code: SocketErrorCode, message: string) {
  sendJson(socket, { type: "error", error: { code, message } });
}

function broadcastMessage(conversationId: string, message: unknown) {
  for (const client of rooms.get(conversationId) ?? []) {
    sendJson(client, { type: "message:new", data: message });
  }
}

async function handleClientMessage(
  socket: WebSocket,
  conversationId: string,
  userId: string,
  rawData: WebSocket.RawData
) {
  try {
    const payload = sendMessageSchema.parse(JSON.parse(rawData.toString()));
    const message = await conversationService.sendMessage(conversationId, userId, payload.text);
    broadcastMessage(conversationId, message);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      const message =
        error instanceof z.ZodError
          ? error.issues.map((issue) => issue.message).join(", ")
          : "Message must be valid JSON";
      sendError(socket, "BAD_REQUEST", message);
      return;
    }

    if (error instanceof AppError) {
      sendError(socket, "FORBIDDEN", error.message);
      return;
    }

    console.error("WebSocket message error", error);
    sendError(socket, "INTERNAL_ERROR", "Unable to send message");
  }
}

function attachClient(socket: WebSocket, conversationId: string, userId: string) {
  const room = rooms.get(conversationId) ?? new Set<WebSocket>();
  room.add(socket);
  rooms.set(conversationId, room);

  sendJson(socket, { type: "connection:ready", data: { conversationId } });

  let messageQueue = Promise.resolve();
  socket.on("message", (rawData) => {
    messageQueue = messageQueue.then(() =>
      handleClientMessage(socket, conversationId, userId, rawData)
    );
  });

  socket.on("close", () => {
    room.delete(socket);
    if (room.size === 0) rooms.delete(conversationId);
  });

  socket.on("error", (error) => {
    console.error("WebSocket connection error", error);
  });
}

export function attachChatWebSocketServer(server: HttpServer) {
  const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });

  server.on("upgrade", async (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const pathMatch = CHAT_PATH.exec(url.pathname);
    if (!pathMatch) {
      writeUpgradeError(socket, 404, "WebSocket endpoint not found");
      return;
    }

    if (request.headers.origin && request.headers.origin !== env.CORS_ORIGIN) {
      writeUpgradeError(socket, 403, "Origin is not allowed");
      return;
    }

    try {
      let conversationId: string;
      try {
        conversationId = conversationIdSchema.parse(decodeURIComponent(pathMatch[1]));
      } catch {
        throw new BadRequestError("Conversation ID must be a valid UUID");
      }

      const userId = await authenticate(request, url);
      await conversationService.assertParticipant(conversationId, userId);

      webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
        attachClient(webSocket, conversationId, userId);
      });
    } catch (error) {
      if (error instanceof AppError) {
        writeUpgradeError(socket, error.statusCode, error.message);
        return;
      }
      console.error("WebSocket upgrade error", error);
      writeUpgradeError(socket, 500, "Unable to establish WebSocket connection");
    }
  });

  return webSocketServer;
}
