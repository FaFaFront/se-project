import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { NotFoundError, UnauthorizedError } from "../src/common/errors/app-error.js";
import { conversationController } from "../src/controller/conversation.controller.js";
import { conversationRepository } from "../src/repository/conversation.repository.js";
import { userRepository } from "../src/repository/user.repository.js";
import { conversationService, serializeMessage } from "../src/service/conversation.service.js";
import { callController, fakeTransaction, ID, restorePrisma } from "./helpers.js";

const sender = { id: ID.user, name: "Amy", role: "student", profileUrl: null };
const at = (iso: string) => new Date(iso);

function messageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    conversationId: ID.conversation,
    senderId: ID.user,
    type: "text",
    text: "hello",
    createdAt: at("2026-02-01T00:00:00.000Z"),
    sender,
    ...overrides,
  };
}

function inboxRow(id: string, lastMessageAt: string | null) {
  return {
    id,
    createdAt: at("2026-01-01T00:00:00.000Z"),
    participantA: { id: ID.user, name: "Me", profileUrl: null },
    participantB: { id: ID.other, name: "Them", profileUrl: null },
    messages: lastMessageAt
      ? [{ text: "hi", createdAt: at(lastMessageAt), senderId: ID.other, type: "text" }]
      : [],
  };
}

afterEach(() => {
  jest.restoreAllMocks();
  restorePrisma();
});

describe("serializeMessage", () => {
  test("CV-01 text message keeps its sender and an ISO date", () => {
    expect(serializeMessage(messageRow() as never)).toEqual({
      id: "m1",
      conversationId: ID.conversation,
      text: "hello",
      createdAt: "2026-02-01T00:00:00.000Z",
      type: "text",
      senderId: ID.user,
      sender,
    });
  });

  test("CV-02 system message has no sender", () => {
    const message = serializeMessage(
      messageRow({ type: "system", senderId: null, sender: null }) as never
    );

    expect(message).toMatchObject({ type: "system", senderId: null, sender: null });
  });

  test("CV-03 text message without a sender is a data error", () => {
    expect(() => serializeMessage(messageRow({ sender: null }) as never)).toThrow(
      "Text message is missing its sender"
    );
  });
});

describe("conversationService", () => {
  test("CV-04 inbox shows the other participant, newest message first, empty chats last", async () => {
    jest
      .spyOn(conversationRepository, "findAllForUser")
      .mockResolvedValue([
        inboxRow("old", "2026-02-01T00:00:00.000Z"),
        inboxRow("empty", null),
        inboxRow("new", "2026-03-01T00:00:00.000Z"),
      ] as never);

    const list = await conversationService.listForUser(ID.user);

    expect(list.map((c) => c.id)).toEqual(["new", "old", "empty"]);
    expect(list[0].otherParticipant.id).toBe(ID.other);
    expect(list[0].lastMessage).toEqual({
      text: "hi",
      createdAt: "2026-03-01T00:00:00.000Z",
      senderId: ID.other,
      type: "text",
    });
    expect(list[2].lastMessage).toBeNull();
  });

  test("CV-05 inbox picks participant A when the caller is participant B", async () => {
    jest
      .spyOn(conversationRepository, "findAllForUser")
      .mockResolvedValue([inboxRow("c", null)] as never);

    const [item] = await conversationService.listForUser(ID.other);

    expect(item.otherParticipant.id).toBe(ID.user);
  });

  test("CV-06 message history returns the other participant and serialized messages", async () => {
    jest.spyOn(conversationRepository, "findMessageHistoryForParticipant").mockResolvedValue({
      id: ID.conversation,
      participantAId: ID.user,
      participantBId: ID.other,
      participantA: sender,
      participantB: { ...sender, id: ID.other },
      messages: [messageRow()],
    } as never);

    const history = await conversationService.getMessageHistory(ID.conversation, ID.user);

    expect(history.participant.id).toBe(ID.other);
    expect(history.messages[0].createdAt).toBe("2026-02-01T00:00:00.000Z");
  });

  test("CV-07 history and requireParticipant hide other people's chats behind 404", async () => {
    jest.spyOn(conversationRepository, "findMessageHistoryForParticipant").mockResolvedValue(null);
    jest.spyOn(conversationRepository, "findByIdForParticipant").mockResolvedValue(null);

    await expect(
      conversationService.getMessageHistory(ID.conversation, ID.user)
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      conversationService.requireParticipant(ID.conversation, ID.user)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("CV-08 sendMessage checks membership before saving", async () => {
    jest.spyOn(conversationRepository, "findByIdForParticipant").mockResolvedValue(null);
    const create = jest.spyOn(conversationRepository, "createMessage");

    await expect(
      conversationService.sendMessage(ID.conversation, ID.user, "hi")
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(create).not.toHaveBeenCalled();
  });

  test("CV-09 sendMessage saves and serializes for a participant", async () => {
    jest
      .spyOn(conversationRepository, "findByIdForParticipant")
      .mockResolvedValue({ id: ID.conversation });
    const create = jest
      .spyOn(conversationRepository, "createMessage")
      .mockResolvedValue(messageRow() as never);

    const message = await conversationService.sendMessage(ID.conversation, ID.user, "hello");

    expect(create).toHaveBeenCalledWith(ID.conversation, ID.user, "hello");
    expect(message.type).toBe("text");
  });

  test("CV-10 getOrCreateConversation refuses yourself and unknown users", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue(null);
    const findOrCreate = jest.spyOn(conversationRepository, "findOrCreateForUsers");

    await expect(
      conversationService.getOrCreateConversation(ID.user, ID.user)
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      conversationService.getOrCreateConversation(ID.user, ID.other)
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(findOrCreate).not.toHaveBeenCalled();
  });

  test("CV-11 getOrCreateConversation returns only the id", async () => {
    jest.spyOn(userRepository, "findProfileOwnerById").mockResolvedValue({} as never);
    jest
      .spyOn(conversationRepository, "findOrCreateForUsers")
      .mockResolvedValue({ id: ID.conversation, secret: "x" } as never);

    expect(await conversationService.getOrCreateConversation(ID.user, ID.other)).toEqual({
      id: ID.conversation,
    });
  });

  test("CV-12 sendSettlementNotice returns null when there is nothing to send", async () => {
    jest.spyOn(conversationRepository, "createSettlementNotice").mockResolvedValue(null);

    expect(await conversationService.sendSettlementNotice(ID.session)).toBeNull();
  });
});

describe("conversationRepository", () => {
  function settledSession(overrides: Record<string, unknown> = {}) {
    return {
      id: ID.session,
      attendanceTrackingEnabled: true,
      settlementNotifiedAt: null,
      status: "completed",
      endedAt: at("2026-04-01T09:00:00.000Z"),
      amountCharged: new Prisma.Decimal(350),
      scheduledAt: at("2026-04-01T08:00:00.000Z"),
      classroom: { tutorId: ID.tutor, studentId: ID.student },
      ...overrides,
    };
  }

  function fakeNotice(session: object | null) {
    const created = messageRow({ type: "system", senderId: null, sender: null });
    const messageCreate = jest.fn(async (_args: { data: { text: string } }) => created);
    const sessionUpdate = jest.fn(async (_args: object) => ({}));
    fakeTransaction({
      meetSession: { findUnique: jest.fn(async () => session), update: sessionUpdate },
      message: { findUnique: jest.fn(async () => null), create: messageCreate },
      conversation: { findFirst: jest.fn(async () => ({ id: ID.conversation })) },
    });
    return { messageCreate, sessionUpdate };
  }

  test("CR-01 completed session notice states the amount in Bangkok time and marks it sent", async () => {
    const { messageCreate, sessionUpdate } = fakeNotice(settledSession());

    await conversationRepository.createSettlementNotice(ID.session);

    const data = messageCreate.mock.calls[0][0].data;
    expect(data.text).toContain("THB 350.00 was deducted");
    expect(data.text).toContain("15:00");
    expect(data).toMatchObject({
      type: "system",
      systemEventKey: `session:${ID.session}:settlement`,
    });
    expect(sessionUpdate).toHaveBeenCalled();
  });

  test("CR-02 missed session notice says nobody was charged", async () => {
    const { messageCreate } = fakeNotice(
      settledSession({ status: "missed", amountCharged: new Prisma.Decimal(0) })
    );

    await conversationRepository.createSettlementNotice(ID.session);

    expect(messageCreate.mock.calls[0][0].data.text).toContain("Nobody was charged");
  });

  test.each([
    ["a missing session", null],
    ["an already notified session", settledSession({ settlementNotifiedAt: new Date() })],
    ["an unsettled session", settledSession({ status: "ongoing" })],
    ["no charge recorded", settledSession({ amountCharged: null })],
    ["no end time", settledSession({ endedAt: null })],
  ])("CR-03 sends nothing for %s", async (_label, session) => {
    const { messageCreate } = fakeNotice(session);

    expect(await conversationRepository.createSettlementNotice(ID.session)).toBeNull();
    expect(messageCreate).not.toHaveBeenCalled();
  });

  test("CR-04 createSystemMessage with a known event key returns the existing message", async () => {
    const existing = messageRow({ type: "system" });
    const create = jest.fn();
    const tx = fakeTransaction({
      message: { findUnique: jest.fn(async () => existing), create },
    });

    const result = await conversationRepository.createSystemMessage(
      ID.tutor,
      ID.student,
      "x",
      "event-1",
      tx as never
    );

    expect(result).toBe(existing);
    expect(create).not.toHaveBeenCalled();
  });

  test("CR-05 findOrCreateForUsers stores the pair in sorted order and reuses an existing chat", async () => {
    const create = jest.fn(async (_args: { data: object }) => ({ id: "new" }));
    const findFirst = jest.fn(async () => null);
    fakeTransaction({ conversation: { findFirst, create } });

    await conversationRepository.findOrCreateForUsers(ID.other, ID.user);

    expect(create.mock.calls[0][0].data).toEqual({
      participantAId: ID.user,
      participantBId: ID.other,
    });

    findFirst.mockResolvedValueOnce({ id: "old" } as never);
    expect(await conversationRepository.findOrCreateForUsers(ID.user, ID.other)).toEqual({
      id: "old",
    });
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe("conversationController", () => {
  const user = { id: ID.user, role: "student" };

  test.each([
    ["listConversations", conversationController.listConversations],
    ["startConversation", conversationController.startConversation],
    ["getMessageHistory", conversationController.getMessageHistory],
  ])("VC-01 %s without a user is 401", async (_label, handler) => {
    const { error } = await callController(handler, {});

    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  test("VC-02 startConversation validates the other user id", async () => {
    const start = jest
      .spyOn(conversationService, "getOrCreateConversation")
      .mockResolvedValue({ id: ID.conversation });

    const bad = await callController(conversationController.startConversation, {
      user,
      body: { otherUserId: "abc" },
    });
    const good = await callController(conversationController.startConversation, {
      user,
      body: { otherUserId: ID.other },
    });

    expect(bad.error).toBeInstanceOf(ZodError);
    expect(start).toHaveBeenCalledWith(ID.user, ID.other);
    expect(good.body.data).toEqual({ id: ID.conversation });
  });

  test("VC-03 getMessageHistory rejects a bad id and is never cached", async () => {
    jest.spyOn(conversationService, "getMessageHistory").mockResolvedValue({} as never);

    const bad = await callController(conversationController.getMessageHistory, {
      user,
      params: { conversationId: "1" },
    });
    const good = await callController(conversationController.getMessageHistory, {
      user,
      params: { conversationId: ID.conversation },
    });

    expect(bad.error).toBeInstanceOf(ZodError);
    expect(good.res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  test("VC-04 listConversations passes service errors to next()", async () => {
    const failure = new Error("down");
    jest.spyOn(conversationService, "listForUser").mockRejectedValue(failure);

    const { error, res } = await callController(conversationController.listConversations, { user });

    expect(error).toBe(failure);
    expect(res.json).not.toHaveBeenCalled();
  });
});
