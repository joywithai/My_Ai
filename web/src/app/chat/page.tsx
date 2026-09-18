"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import AvatarStage from "@/components/avatar/AvatarStage";
import ChatInput from "@/components/chat/ChatInput";
import Subtitles from "@/components/chat/Subtitles";
import { useAuth } from "@/lib/store/auth";
import { useSettings } from "@/lib/store/settings";
import { useChat } from "@/lib/store/chat";
import { useUi } from "@/lib/store/framing";
import { getEngine } from "@/lib/engine/AvatarEngine";
import { buildSpeakTimeline } from "@/lib/engine/lipsync";
import { sendMockMessage } from "@/lib/mock/chatService";
import { demoSpeak, demoSpeakStop } from "@/lib/speak";

interface Sub {
  text: string;
  expression: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);
  const settings = useSettings((s) => s.settings);
  const flags = useSettings((s) => s.flags);
  const showToast = useUi((s) => s.showToast);

  const ensureConversation = useChat((s) => s.ensureConversation);
  const addMessage = useChat((s) => s.addMessage);
  const bumpDaily = useChat((s) => s.bumpDaily);
  const dailyCount = useChat((s) => s.dailyCount);

  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [sub, setSub] = useState<Sub | null>(null);
  const subTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !user) router.replace("/");
  }, [mounted, user, router]);

  const clearSubLater = useCallback((ms: number) => {
    if (subTimer.current) clearTimeout(subTimer.current);
    subTimer.current = setTimeout(() => setSub(null), ms);
  }, []);

  // greeting subtitle after avatar loads
  const onAvatarLoaded = useCallback(() => {
    const bn = settings.language === "bn";
    setSub({ text: bn ? "নমস্কার! আমি MyAi 👋" : "Hello! I'm MyAi 👋", expression: "happy" });
    greetTimer.current = setTimeout(() => setSub(null), 2600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language]);

  const handleSend = useCallback(
    async (text: string) => {
      if (busy || !user) return;
      const lang = settings.language;
      const roleFlags = flags[user.role];
      const todayCount = useChat.getState().dailyCount;
      if (roleFlags.maxMessagesPerDay >= 0 && todayCount >= roleFlags.maxMessagesPerDay) {
        showToast(
          lang === "bn"
            ? `আজকের লিমিট শেষ (${roleFlags.maxMessagesPerDay})! সাবস্ক্রাইব করলে বেশি কথা বলা যাবে 🚀`
            : `Daily limit reached (${roleFlags.maxMessagesPerDay})! Subscribe for more 🚀`,
          "info"
        );
        return;
      }

      const convId = ensureConversation(lang);
      addMessage({ conversationId: convId, role: "user", content: text, language: lang });
      bumpDaily();

      // thinking phase 🤔
      setBusy(true);
      setThinking(true);
      setSub(null);
      const engine = getEngine();
      engine.setState("thinking");

      const result = await sendMockMessage(text, lang);
      const fullText = result.segments.map((s) => s.text).join(" ");
      const timeline = buildSpeakTimeline(result.segments, lang);

      engine.onSegment = (idx) => {
        const seg = timeline.segs[idx];
        if (seg) setSub({ text: seg.text, expression: seg.expr });
      };
      engine.onDone = () => {
        setBusy(false);
        setThinking(false);
        setSub(null);
      };

      // speak phase 🗣️
      setThinking(false);
      engine.speakWithTimeline(timeline);
      if (settings.demoVoiceOn && settings.autoPlayAudio) {
        demoSpeak(fullText, lang, settings.voiceSpeed, settings.voicePitch);
      }

      addMessage({
        conversationId: convId,
        role: "assistant",
        content: fullText,
        language: lang,
        segments: result.segments,
      });
    },
    [busy, user, settings, flags, ensureConversation, addMessage, bumpDaily, showToast]
  );

  const handleStop = useCallback(() => {
    const engine = getEngine();
    engine.stopSpeaking();
    demoSpeakStop();
    setBusy(false);
    setThinking(false);
    setSub(null);
  }, []);

  // deep-link: /chat?c=<conversationId>
  useEffect(() => {
    if (!mounted) return;
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) useChat.getState().setCurrent(c);
  }, [mounted]);

  if (!mounted || !user) return <div className="h-dvh bg-bg" />;

  return (
    <main className="flex h-dvh flex-col">
      <TopBar />

      {/* avatar stage fills everything between bar & input */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <AvatarStage mode="chat" onLoaded={onAvatarLoaded} />
        </div>

        {/* thinking indicator */}
        {thinking && (
          <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
            <div className="glass flex items-center gap-1.5 rounded-full px-4 py-2">
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="ml-1 text-[11px] text-muted">
                {settings.language === "bn" ? "ভাবছি…" : "thinking…"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* subtitles + input */}
      {settings.showSubtitles && <Subtitles text={sub?.text ?? ""} expression={sub?.expression} visible={!!sub} className="mb-2" />}
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
