"use client";
import { ExpressionSegment } from "../types";
import { mockReply } from "./data";

export interface MockChatResult {
  segments: ExpressionSegment[];
  delayMs: number;
}

/** Fake AI call — later replaced by POST /api/v1/chat/ask */
export async function sendMockMessage(
  _text: string,
  lang: "bn" | "en"
): Promise<MockChatResult> {
  const delay = 1300 + Math.random() * 1200;
  await new Promise((r) => setTimeout(r, delay));
  return { segments: mockReply(lang).segments, delayMs: delay };
}
