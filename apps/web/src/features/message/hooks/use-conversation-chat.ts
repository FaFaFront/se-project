"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { connectChatSocket, disconnectChatSocket, getChatSocket } from "@/lib/socket-client";
import { SOCKET_EVENTS, type SocketConnectionErrorData } from "@/types/chat-socket";
import type { ChatMessage, ChatParticipant, MessageHistory } from "@/types/conversation";
import { mergeMessages } from "../utils/merge-messages";

type ChatState = {
  participant: ChatParticipant | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
};

function initialState(): ChatState {
  return { participant: null, messages: [], isLoading: true, isConnected: false, error: null };
}

function connectionErrorMessage(error: Error & { data?: SocketConnectionErrorData }): string {
  const code = error.data?.code;
  if (code === "AUTH_TOKEN_MISSING" || code === "AUTH_TOKEN_INVALID") {
    return "Your session has expired. Please sign in again.";
  }
  if (code === "ACCOUNT_NOT_FOUND" || code === "ACCOUNT_INACTIVE") {
    return "Chat is unavailable for this account.";
  }
  return "Unable to connect to chat. Please retry.";
}

export function useConversationChat(conversationId: string, enabled: boolean) {
  const [state, setState] = useState<ChatState>(initialState);
  const [retryCount, setRetryCount] = useState(0);
  const joinedRef = useRef(false);
  const lifecycleRef = useRef(0);
  const activeConversationRef = useRef(conversationId);
  activeConversationRef.current = conversationId;

  useEffect(() => {
    joinedRef.current = false;
    setState(initialState());
  }, [conversationId]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let joinSequence = 0;
    const lifecycle = ++lifecycleRef.current;
    const socket = getChatSocket();

    async function joinAndLoad() {
      const sequence = ++joinSequence;
      joinedRef.current = false;
      setState((current) => ({
        ...current,
        isConnected: false,
        isLoading: !current.participant,
        error: null,
      }));

      try {
        const joined = await socket
          .timeout(10000)
          .emitWithAck(SOCKET_EVENTS.conversationJoin, { conversationId });
        if (!active || sequence !== joinSequence) return;
        if (!joined.success) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error:
              joined.code === "CONVERSATION_NOT_FOUND"
                ? "Conversation not found."
                : "Unable to join this conversation. Please retry.",
          }));
          return;
        }

        joinedRef.current = true;
        setState((current) => ({ ...current, isConnected: true, error: null }));

        const history = await apiClient.get<MessageHistory>(
          `/conversations/${encodeURIComponent(conversationId)}/messages`
        );
        if (!active || sequence !== joinSequence) return;
        setState((current) => ({
          ...current,
          participant: history.participant,
          messages: mergeMessages(current.messages, history.messages),
          isLoading: false,
          error: null,
        }));
      } catch {
        if (!active || sequence !== joinSequence) return;
        setState((current) => ({
          ...current,
          isLoading: false,
          error: joinedRef.current
            ? "Unable to load conversation history. Please retry."
            : "Unable to join this conversation. Please retry.",
        }));
      }
    }

    function onConnect() {
      void joinAndLoad();
    }

    function onMessageNew({ message }: { message: ChatMessage }) {
      if (!active || message?.conversationId !== conversationId || typeof message.id !== "string") {
        return;
      }
      setState((current) => ({
        ...current,
        messages: mergeMessages(current.messages, message),
      }));
    }

    function onDisconnect() {
      joinSequence += 1;
      joinedRef.current = false;
      if (!active) return;
      setState((current) => ({
        ...current,
        isConnected: false,
        isLoading: false,
        error: "Connection lost. Reconnecting...",
      }));
    }

    function onConnectError(error: Error & { data?: SocketConnectionErrorData }) {
      joinSequence += 1;
      joinedRef.current = false;
      if (!active) return;
      setState((current) => ({
        ...current,
        isConnected: false,
        isLoading: false,
        error: connectionErrorMessage(error),
      }));
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(SOCKET_EVENTS.messageNew, onMessageNew);

    if (socket.connected) onConnect();
    else connectChatSocket();

    return () => {
      active = false;
      joinSequence += 1;
      if (lifecycleRef.current === lifecycle) lifecycleRef.current += 1;
      joinedRef.current = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(SOCKET_EVENTS.messageNew, onMessageNew);
      if (socket.connected) socket.emit(SOCKET_EVENTS.conversationLeave, { conversationId });
      disconnectChatSocket();
    };
  }, [conversationId, enabled, retryCount]);

  const sendMessage = useCallback(
    async (text: string) => {
      const socket = getChatSocket();
      if (!enabled || !socket.connected || !joinedRef.current) {
        throw new Error("Chat is reconnecting. Please try again shortly.");
      }

      const lifecycle = lifecycleRef.current;
      try {
        const response = await socket
          .timeout(10000)
          .emitWithAck(SOCKET_EVENTS.messageSend, { conversationId, text });
        if (!response.success) throw new Error(response.message);
        if (
          lifecycle === lifecycleRef.current &&
          activeConversationRef.current === conversationId
        ) {
          setState((current) => ({
            ...current,
            messages: mergeMessages(current.messages, response.data.message),
          }));
        }
      } catch (error) {
        if (error instanceof Error && error.message === "operation has timed out") {
          throw new Error("Message timed out. Please try again.");
        }
        throw error;
      }
    },
    [conversationId, enabled]
  );

  const retry = useCallback(() => {
    setState((current) => ({ ...current, error: null, isLoading: !current.participant }));
    setRetryCount((current) => current + 1);
  }, []);

  return { ...state, sendMessage, retry };
}
