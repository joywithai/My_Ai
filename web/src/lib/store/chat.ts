"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Conversation, Message } from "../types";
import { uid } from "../utils";

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  currentId: string | null;
  dailyCount: number;
  dailyCountDate: string;
  ensureConversation: (lang: "bn" | "en") => string;
  addMessage: (m: Omit<Message, "id" | "createdAt">) => Message;
  setCurrent: (id: string | null) => void;
  deleteConversation: (id: string) => void;
  clearAll: () => void;
  bumpDaily: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: [],
      currentId: null,
      dailyCount: 0,
      dailyCountDate: todayStr(),

      ensureConversation: (lang) => {
        const { currentId, conversations } = get();
        if (currentId) return currentId;
        const id = uid("conv");
        const title =
          lang === "bn" ? "নতুন কথাবার্তা" : "New conversation";
        set((s) => ({
          currentId: id,
          conversations: [
            { id, title, createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0 },
            ...s.conversations,
          ],
        }));
        return id;
      },

      addMessage: (m) => {
        const msg: Message = { ...m, id: uid("msg"), createdAt: Date.now() };
        set((s) => ({
          messages: [...s.messages, msg],
          conversations: s.conversations.map((c) =>
            c.id === m.conversationId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messageCount: c.messageCount + 1,
                  title:
                    c.messageCount === 0 && m.role === "user"
                      ? m.content.slice(0, 42) + (m.content.length > 42 ? "…" : "")
                      : c.title,
                }
              : c
          ),
        }));
        return msg;
      },

      setCurrent: (id) => set({ currentId: id }),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          messages: s.messages.filter((m) => m.conversationId !== id),
          currentId: s.currentId === id ? null : s.currentId,
        })),
      clearAll: () => set({ conversations: [], messages: [], currentId: null }),
      bumpDaily: () =>
        set((s) => ({
          dailyCount: s.dailyCountDate === todayStr() ? s.dailyCount + 1 : 1,
          dailyCountDate: todayStr(),
        })),
    }),
    { name: "myai.chat" }
  )
);
