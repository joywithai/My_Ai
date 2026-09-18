"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EMOJI: Record<string, string> = {
  neutral: "🙂",
  happy: "😊",
  excited: "🤩",
  sad: "😢",
  angry: "😠",
  surprised: "😲",
  relaxed: "😌",
  friendly: "😊",
  confused: "🤨",
  thoughtful: "🤔",
  concerned: "🙁",
  serious: "😐",
};

export default function Subtitles({
  text,
  expression,
  visible,
  className,
}: {
  text: string;
  expression?: string;
  visible: boolean;
  className?: string;
}) {
  const [shown, setShown] = useState<{ text: string; expression?: string } | null>(null);

  useEffect(() => {
    if (visible && text) setShown({ text, expression });
    else setShown(null);
  }, [text, expression, visible]);

  return (
    <div className={cn("pointer-events-none mx-auto w-full max-w-[1000px] px-4", className)}>
      <div
        className={cn(
          "mx-auto max-w-[640px] transition-all duration-300",
          shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        )}
      >
        {shown && (
          <div className="glass rise-in mx-auto flex w-fit items-center gap-2.5 rounded-2xl px-5 py-3 shadow-2xl">
            <span className="text-base leading-none">{EMOJI[shown.expression ?? ""] ?? "💬"}</span>
            <p className="text-center text-[13.5px] leading-relaxed text-txt/95">{shown.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
