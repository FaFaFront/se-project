import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import jwt from "jsonwebtoken";
import { NotFoundError } from "../src/common/errors/app-error.js";
import { env } from "../src/config/env.js";
import { authRepository } from "../src/repository/auth.repository.js";
import { conversationService } from "../src/service/conversation.service.js";
import { registerConversationRoomHandlers } from "../src/socket/handlers/conversation-room.handler.js";
import { registerMessageHandlers } from "../src/socket/handlers/message.handler.js";
import { socketAuthMiddleware } from "../src/socket/middleware/socket-auth.middleware.js";
import { ID } from "./helpers.js";

type Handler = (payload: unknown, ack?: unknown) => Promise<void>;

/** A socket stand-in that records handlers so a test can fire events at them. */
function fakeSocket(rooms: string[] = []) {
  const handlers = new Map<string, Handler>();
  const socket = {
    data: { user: { id: ID.user, role: "student" } },
    rooms: new Set([ID.user, ...rooms]),
    handshake: { auth: {} as Record<string, unknown> },
    on: (event: string, handler: Handler) => handlers.set(event, handler),
    join: jest.fn(async (room: string) => void socket.rooms.add(room)),
    leave: jest.fn(async (room: string) => void socket.rooms.delete(room)),
  };
  const fire = async (event: string, payload: unknown) => {
    const ack = jest.fn();
    await handlers.get(event)!(payload, ack);
    return ack.mock.calls[0]?.[0] as Record<string, unknown>;
  };
  return { socket, fire };
}

const room = (id: string) => `conversation:${id}`;

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("socketAuthMiddleware", () => {
  const token = (payload: object = { sub: ID.user, role: "tutor" }) =>
    jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

  async function connect(auth: Record<string, unknown>) {
    const { socket } = fakeSocket();
    socket.handshake.auth = auth;
    const next = jest.fn();
    socketAuthMiddleware(socket as never, next);
    await new Promise((resolve) => setImmediate(resolve));
    return {
      socket,
      error: next.mock.calls[0]?.[0] as (Error & { data?: { code: string } }) | undefined,
    };
  }

  test("SK-01 a valid token for an active account connects and sets the user", async () => {
    jest
      .spyOn(authRepository, "findAccountStatusById")
      .mockResolvedValue({ id: ID.user, accountStatus: "ACTIVE" });

    const { socket, error } = await connect({ token: token() });

    expect(error).toBeUndefined();
    expect(socket.data.user).toEqual({ id: ID.user, role: "tutor" });
  });

  test.each([
    ["no token", {}, "AUTH_TOKEN_MISSING"],
    ["a blank token", { token: "  " }, "AUTH_TOKEN_MISSING"],
    ["a non-string token", { token: 42 }, "AUTH_TOKEN_MISSING"],
    [
      "a forged token",
      { token: jwt.sign({ sub: ID.user, role: "tutor" }, "wrong") },
      "AUTH_TOKEN_INVALID",
    ],
  ])("SK-02 %s is refused", async (_label, auth, code) => {
    const lookup = jest.spyOn(authRepository, "findAccountStatusById");

    const { error } = await connect(auth);

    expect(error?.data?.code).toBe(code);
    expect(lookup).not.toHaveBeenCalled();
  });

  test.each([
    ["a deleted account", null, "ACCOUNT_NOT_FOUND"],
    ["an inactive account", { id: ID.user, accountStatus: "INACTIVE" }, "ACCOUNT_INACTIVE"],
  ])("SK-03 %s is refused", async (_label, account, code) => {
    jest.spyOn(authRepository, "findAccountStatusById").mockResolvedValue(account as never);

    const { error } = await connect({ token: token() });

    expect(error?.data?.code).toBe(code);
  });

  test("SK-04 a database failure is reported as INTERNAL_ERROR without details", async () => {
    jest
      .spyOn(authRepository, "findAccountStatusById")
      .mockRejectedValue(new Error("password=secret"));

    const { error } = await connect({ token: token() });

    expect(error?.data?.code).toBe("INTERNAL_ERROR");
    expect(error?.message).not.toContain("secret");
  });
});

describe("conversation room handlers", () => {
  test("SK-05 joining leaves the previous conversation room but keeps other rooms", async () => {
    const { socket, fire } = fakeSocket([room(ID.other)]);
    registerConversationRoomHandlers(socket as never);
    jest.spyOn(conversationService, "requireParticipant").mockResolvedValue(ID.conversation);

    const ack = await fire("conversation:join", { conversationId: ID.conversation });

    expect(ack).toEqual({ success: true, data: { conversationId: ID.conversation } });
    expect([...socket.rooms]).toEqual([ID.user, room(ID.conversation)]);
  });

  test.each([
    ["a bad id", { conversationId: "x" }, undefined, "INVALID_CONVERSATION_ID"],
    [
      "an extra field",
      { conversationId: ID.conversation, admin: true },
      undefined,
      "INVALID_CONVERSATION_ID",
    ],
    [
      "someone else's chat",
      { conversationId: ID.conversation },
      new NotFoundError(),
      "CONVERSATION_NOT_FOUND",
    ],
    ["a database failure", { conversationId: ID.conversation }, new Error("db"), "INTERNAL_ERROR"],
  ])("SK-06 joining with %s fails and joins nothing", async (_label, payload, failure, code) => {
    const { socket, fire } = fakeSocket();
    registerConversationRoomHandlers(socket as never);
    const check = jest.spyOn(conversationService, "requireParticipant");
    if (failure) check.mockRejectedValue(failure);

    const ack = await fire("conversation:join", payload);

    expect(ack).toMatchObject({ success: false, code });
    expect(socket.join).not.toHaveBeenCalled();
  });

  test("SK-07 leave removes the room; a missing ack callback is not an error", async () => {
    const { socket } = fakeSocket([room(ID.conversation)]);
    const handlers = new Map<string, Handler>();
    socket.on = (event: string, handler: Handler) => handlers.set(event, handler);
    registerConversationRoomHandlers(socket as never);

    await handlers.get("conversation:leave")!(
      { conversationId: ID.conversation },
      "not a function"
    );

    expect(socket.rooms.has(room(ID.conversation))).toBe(false);
  });
});

describe("message handler", () => {
  function setup({ inRoom = true, canBroadcast = true } = {}) {
    const { socket, fire } = fakeSocket(inRoom ? [room(ID.conversation)] : []);
    const emit = jest.fn((_event: string, _payload: unknown) => {});
    const io = { to: jest.fn((_room: string) => ({ emit })) };
    registerMessageHandlers(io as never, socket as never, () => canBroadcast);
    return { fire, io, emit };
  }

  const saved = { id: "m1", text: "hi" } as never;

  test("SK-08 a message is saved, broadcast to the room and acknowledged", async () => {
    const { fire, io, emit } = setup();
    const send = jest.spyOn(conversationService, "sendMessage").mockResolvedValue(saved);

    const ack = await fire("message:send", { conversationId: ID.conversation, text: "  hi  " });

    expect(send).toHaveBeenCalledWith(ID.conversation, ID.user, "hi");
    expect(io.to).toHaveBeenCalledWith(room(ID.conversation));
    expect(emit).toHaveBeenCalledWith("message:new", { message: saved });
    expect(ack).toEqual({ success: true, data: { message: saved, delivery: "persisted" } });
  });

  test.each([
    ["an empty text", { conversationId: ID.conversation, text: "   " }],
    ["a 2001 character text", { conversationId: ID.conversation, text: "a".repeat(2001) }],
    ["a bad id", { conversationId: "x", text: "hi" }],
  ])("SK-09 %s is INVALID_MESSAGE and not saved", async (_label, payload) => {
    const { fire } = setup();
    const send = jest.spyOn(conversationService, "sendMessage");

    expect(await fire("message:send", payload)).toMatchObject({ code: "INVALID_MESSAGE" });
    expect(send).not.toHaveBeenCalled();
  });

  test("SK-10 sending without joining the room is refused", async () => {
    const { fire } = setup({ inRoom: false });
    const send = jest.spyOn(conversationService, "sendMessage");

    const ack = await fire("message:send", { conversationId: ID.conversation, text: "hi" });

    expect(ack).toMatchObject({ code: "NOT_IN_CONVERSATION_ROOM" });
    expect(send).not.toHaveBeenCalled();
  });

  test("SK-11 when Redis fanout is down nothing is saved", async () => {
    const { fire } = setup({ canBroadcast: false });
    const send = jest.spyOn(conversationService, "sendMessage");

    const ack = await fire("message:send", { conversationId: ID.conversation, text: "hi" });

    expect(ack).toMatchObject({ code: "INTERNAL_ERROR" });
    expect(send).not.toHaveBeenCalled();
  });

  test("SK-12 a broadcast failure after saving still acknowledges success", async () => {
    const { fire, emit } = setup();
    jest.spyOn(conversationService, "sendMessage").mockResolvedValue(saved);
    emit.mockImplementation(() => {
      throw new Error("adapter down");
    });

    const ack = await fire("message:send", { conversationId: ID.conversation, text: "hi" });

    expect(ack).toMatchObject({ success: true });
  });

  test.each([
    [new NotFoundError(), "CONVERSATION_NOT_FOUND"],
    [new Error("db"), "INTERNAL_ERROR"],
  ])("SK-13 a save failure %p maps to %s", async (failure, code) => {
    const { fire, emit } = setup();
    jest.spyOn(conversationService, "sendMessage").mockRejectedValue(failure);

    const ack = await fire("message:send", { conversationId: ID.conversation, text: "hi" });

    expect(ack).toMatchObject({ success: false, code });
    expect(emit).not.toHaveBeenCalled();
  });
});
