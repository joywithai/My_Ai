"use client";
import { KeyboardEvent, useRef, useState } from "react";
import { SendHorizonal, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const MAX = 500;

export default function ChatInput({
  lang,
  onLang,
  onSend,
  onStop,
  busy,
}: {
  lang: "bn" | "en";
  onLang: (l: "bn" | "en") => void;
  onSend: (text: string) => void;
  onStop?: () => void;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const t = useT();

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] px-3 pb-4 sm:px-5 sm:pb-5">
      <div className="glass flex items-end gap-2 p-2 shadow-2xl">
        {/* language toggle */}
        <div className="flex overflow-hidden rounded-xl border border-line">
          {(["bn", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLang(l)}
              className={cn(
                "px-3 py-2.5 text-xs font-bold transition-all",
                lang === l ? "bg-accent text-[#16101f]" : "text-muted hover:text-txt"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            maxLength={MAX}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder={t("typeMessage")}
            className="input-dark max-h-[120px] resize-none pr-14"
          />
          <span className="pointer-events-none absolute bottom-2.5 right-3 text-[10px] text-muted">
            {text.length}/{MAX}
          </span>
        </div>

        {busy && onStop ? (
          <button
            onClick={onStop}
            className="flex h-[42px] w-[46px] items-center justify-center rounded-xl border border-err/50 bg-err/10 text-err transition hover:bg-err/20 active:scale-95"
            title="থামাও"
          >
            <Square size={15} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="btn-primary flex h-[42px] w-[46px] items-center justify-center !px-0"
            title="পাঠাও"
          >
            <SendHorizonal size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
