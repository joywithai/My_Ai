"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import AvatarStage from "@/components/avatar/AvatarStage";
import ChatInput from "@/components/chat/ChatInput";
import Subtitles from "@/components/chat/Subtitles";
import ThinkingBubbles from "@/components/chat/ThinkingBubbles";
import { useAuth } from "@/lib/store/auth";
import { useSettings } from "@/lib/store/settings";
import { useChat } from "@/lib/store/chat";
import { useUi } from "@/lib/store/framing";
import { api } from "@/lib/api";
import { getEngine } from "@/lib/engine/AvatarEngine";
import { buildSpeakTimeline } from "@/lib/engine/lipsync";
import { demoSpeak, demoSpeakStop } from "@/lib/speak";
import { useT } from "@/lib/i18n";
import type { ExpressionSegment } from "@/lib/types";

interface Sub {
  text: string;
  expression: string;
}

/** charIndex lookup table for segment sync with real audio boundaries */
function segmentOffsets(segs: ExpressionSegment[]) {
  let acc = 0;
  return segs.map((s) => {
    const start = acc;
    acc += s.text.length + 1;
    return { start, end: acc, seg: s };
  });
}

export default function ChatPage() {
  const router = useRouter();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);
  const settings = useSettings((s) => s.settings);

  const addMessage = useChat((s) => s.addMessage);

  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [sub, setSub] = useState<Sub | null>(null);
  const greetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !user) router.replace("/");
  }, [mounted, user, router]);

  // greeting subtitle after avatar loads
  const onAvatarLoaded = useCallback(() => {
    setSub({ text: t("welcome") + " 👋", expression: "happy" });
    greetTimer.current = setTimeout(() => setSub(null), 2600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.uiLanguage]);

  const handleSend = useCallback(
    async (text: string) => {
      if (busy || !user) return;
      const lang = settings.language;
      setBusy(true);
      setThinking(true);
      setSub(null);
      const engine = getEngine();
      engine.setState("thinking");

      try {
        const result = await api<{ conversationId: string; segments: ExpressionSegment[]; usage: { count: number; limit: number } }>(
          "/chat",
          { method: "POST", json: { message: text, lang, conversationId: useChat.getState().currentId ?? undefined } }
        );
        useChat.setState({ currentId: result.conversationId });

        const fullText = result.segments.map((s) => s.text).join(" ");
        const timeline = buildSpeakTimeline(result.segments, lang);
        const offsets = segmentOffsets(result.segments);

        engine.onSegment = (idx) => {
          const seg = result.segments[idx];
          if (seg) setSub({ text: seg.text, expression: seg.expression });
        };
        engine.onDone = () => {
          setBusy(false);
          setThinking(false);
          setSub(null);
        };

        // speak phase — mouth driven by real audio boundary events
        setThinking(false);
        engine.speakWithTimeline(timeline);
        if (settings.demoVoiceOn && settings.autoPlayAudio) {
          const ok = demoSpeak(fullText, lang, settings.voiceSpeed, settings.voicePitch, {
            onBoundary: (charIndex) => {
              const hit = offsets.find((o) => charIndex >= o.start && charIndex < o.end);
              if (hit) setSub({ text: hit.seg.text, expression: hit.seg.expression });
            },
            onEnd: () => {
              /* engine finishes via timeline */
            },
          });
          if (!ok) {
            // no TTS available → fallback: run timeline mouth only
            engine.boundaryMode = false;
          }
        }

        addMessage({
          conversationId: result.conversationId,
          role: "assistant",
          content: fullText,
          language: lang,
          segments: result.segments,
        });
      } catch (e: any) {
        setBusy(false);
        setThinking(false);
        if (e?.status === 429) {
          useUi.getState().showToast(
            settings.uiLanguage === "bn"
              ? `আজকের লিমিট শেষ (${e.data?.limit})! সাবস্ক্রাইব করলে বেশি কথা বলা যাবে 🚀`
              : `Daily limit reached (${e.data?.limit})! Subscribe for more 🚀`,
            "info"
          );
        } else if (e?.status === 403 && e?.data?.error === "banned") {
          useUi.getState().showToast("Account banned", "err");
          useAuth.getState().logout();
          router.replace("/");
        } else {
          useUi.getState().showToast("Something went wrong — try again", "err");
        }
      }
    },
    [busy, user, settings, addMessage, router]
  );

  const handleStop = useCallback(() => {
    const engine = getEngine();
    engine.stopSpeaking();
    demoSpeakStop();
    setBusy(false);
    setThinking(false);
    setSub(null);
  }, []);

  // deep-link: /chat?c=<conversationId> → load messages from server
  useEffect(() => {
    if (!mounted || !user) return;
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) {
      api<{ conversation: any; messages: any[] }>(`/conversations/${c}`)
        .then((res) => {
          useChat.setState({ currentId: c, messages: [] });
          for (const m of res.messages) {
            useChat.getState().addMessage({
              conversationId: c,
              role: m.role,
              content: m.content,
              language: m.lang ?? settings.language,
              segments: m.segments ?? [],
            });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user]);

  if (!mounted || !user) return <div className="h-dvh bg-bg" />;

  return (
    <main className="flex h-dvh flex-col">
      <TopBar />

      {/* avatar stage — everything overlays it, avatar never moves */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <AvatarStage mode="chat" onLoaded={onAvatarLoaded} />
        </div>

        {thinking && <ThinkingBubbles />}

        {thinking && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
            <div className="glass flex items-center gap-1.5 rounded-full px-4 py-2">
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="ml-1 text-[11px] text-muted">{t("thinking")}</span>
            </div>
          </div>
        )}

        {settings.showSubtitles && (
          <div className="absolute inset-x-0 bottom-5 z-10">
            <Subtitles text={sub?.text ?? ""} expression={sub?.expression} visible={!!sub} />
          </div>
        )}
      </div>

      <ChatInput
        lang={settings.language}
        onLang={(l) => useSettings.getState().patch({ language: l })}
        onSend={handleSend}
        onStop={handleStop}
        busy={busy}
      />
    </main>
  );
}
