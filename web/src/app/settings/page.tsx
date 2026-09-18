"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, UserRound, Volume2, Smile, Sparkles, Cpu, History as HistoryIcon,
  Crown, Lock, Trash2, ChevronRight, Play, KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { useSettings } from "@/lib/store/settings";
import { useChat } from "@/lib/store/chat";
import { useUi } from "@/lib/store/framing";
import { Card, SectionTitle, Badge, Toggle, Slider, Select, LockedTag } from "@/components/ui/primitives";
import { PresetExpression, ROLE_LABEL } from "@/lib/types";
import { BANGLA_VOICES, ENGLISH_VOICES } from "@/lib/mock/data";
import { demoSpeak, hasVoiceFor } from "@/lib/speak";
import { cn, timeAgo } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !user) router.replace("/");
  }, [mounted, user, router]);

  if (!mounted || !user) return <div className="h-dvh bg-bg" />;
  return <SettingsInner />;
}

function SettingsInner() {
  const router = useRouter();
  const user = useAuth((s) => s.user)!;
  const logout = useAuth((s) => s.logout);
  const { settings, flags, patch, setExpression, toggleAnimation, saveCustomAi, removeCustomAi } =
    useSettings();
  const showToast = useUi((s) => s.showToast);
  const f = flags[user.role];

  const [name, setName] = useState(user.name);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("google/gemini-2.0-flash-001");
  const [testing, setTesting] = useState(false);

  const voices = settings.language === "bn" ? BANGLA_VOICES : ENGLISH_VOICES;
  const locked = (feature: string) => {
    showToast(`এই ফিচারটা লক করা — ${feature} এর জন্য সাবস্ক্রাইব করো ✨`, "info");
  };

  const PUBLIC_EXPRS: string[] = ["neutral", "happy", "sad", "surprised"];
  const ALL_EXPRS: string[] = [
    ...PUBLIC_EXPRS, "relaxed", "excited", "friendly", "serious", "thoughtful", "confused", "concerned", "angry",
  ];
  const exprList = f.canAccessAllExpressions ? ALL_EXPRS : PUBLIC_EXPRS;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-4 pb-16">
      {/* header */}
      <div className="flex h-14 items-center gap-3">
        <button onClick={() => router.push("/chat")} className="btn-ghost !p-2" title="ফিরে যাও">
          <ArrowLeft size={17} />
        </button>
        <h1 className="text-[15px] font-bold">সেটিংস</h1>
        <Badge tone={user.role === "admin" ? "red" : user.role === "subscriber" ? "purple" : "default"}>
          {ROLE_LABEL[user.role]}
        </Badge>
      </div>

      <div className="mx-auto grid max-w-[640px] gap-4">
        {/* ── Profile ── */}
        <Card>
          <SectionTitle>প্রোফাইল</SectionTitle>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-lg font-bold text-accent">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input className="input-dark" value={name} onChange={(e) => setName(e.target.value)} />
                <button
                  className="btn-ghost shrink-0"
                  onClick={() => {
                    useAuth.getState().updateProfile(name.trim() || user.name);
                    showToast("নাম আপডেট হয়েছে ✅");
                  }}
                >
                  সেভ
                </button>
              </div>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
        </Card>

        {/* ── Voice ── */}
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle hint={hasVoiceFor(settings.language) ? undefined : "এই ব্রাউজারে বাংলা ভয়েস নেই — ইংরেজিতে টেস্ট করো"}>
              🎙️ ভয়েস
            </SectionTitle>
            <span className="text-[10px] text-muted">ডেমো: ব্রাউজার TTS</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-muted">ভাষা</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["bn", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => patch({
                      language: l,
                      voiceName: l === "bn" ? BANGLA_VOICES[0].name : ENGLISH_VOICES[0].name,
                    })}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-semibold transition",
                      settings.language === l ? "border-accent/60 bg-accent-dim text-accent" : "border-line text-muted"
                    )}
                  >
                    {l === "bn" ? "বাংলা" : "English"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-muted">ভয়েস</label>
              <Select
                value={settings.voiceName}
                onChange={(v) => patch({ voiceName: v })}
                options={voices.map((v) => ({ value: v.name, label: v.displayName }))}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted">
                  স্পিড <span className="text-accent">{settings.voiceSpeed.toFixed(2)}x</span>
                  {!f.canCustomizeVoice && <LockedTag />}
                </label>
              </div>
              <Slider
                min={0.5} max={2} step={0.05}
                value={settings.voiceSpeed}
                disabled={!f.canCustomizeVoice}
                onChange={(v) => patch({ voiceSpeed: v })}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted">
                  পিচ <span className="text-accent">{settings.voicePitch > 0 ? `+${settings.voicePitch}` : settings.voicePitch}</span>
                  {!f.canCustomizeVoice && <LockedTag />}
                </label>
              </div>
              <Slider
                min={-50} max={50} step={1}
                value={settings.voicePitch}
                disabled={!f.canCustomizeVoice}
                onChange={(v) => patch({ voicePitch: v })}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 text-xs text-txt/90">
                <Toggle checked={settings.demoVoiceOn} onChange={(v) => patch({ demoVoiceOn: v })} />
                ডেমো ভয়েস (ব্রাউজার TTS)
              </label>
              <button
                className="btn-ghost flex items-center gap-1.5 !py-2 text-xs"
                onClick={() => {
                  const ok = demoSpeak(
                    settings.language === "bn" ? "আমি MyAi, তোমার বন্ধু।" : "I am MyAi, your friend.",
                    settings.language, settings.voiceSpeed, settings.voicePitch
                  );
                  if (!ok) showToast("এই ব্রাউজারে কোনো ভয়েস পাওয়া যায়নি", "err");
                }}
              >
                <Play size={12} /> টেস্ট
              </button>
            </div>
            <label className="flex items-center gap-2.5 text-xs text-txt/90">
              <Toggle checked={settings.autoPlayAudio} onChange={(v) => patch({ autoPlayAudio: v })} />
              উত্তর আসলেই অটো প্লে
            </label>
          </div>
        </Card>

        {/* ── Expressions ── */}
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle>😊 ডিফল্ট এক্সপ্রেশন</SectionTitle>
            {!f.canAccessAllExpressions && <LockedTag />}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_EXPRS.map((e) => {
              const allowed = exprList.includes(e);
              const selected = settings.defaultExpression === e;
              return (
                <button
                  key={e}
                  onClick={() => (allowed ? setExpression(e) : locked("সব এক্সপ্রেশন"))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-medium capitalize transition",
                    selected
                      ? "border-accent/60 bg-accent-dim text-accent"
                      : allowed
                      ? "border-line text-txt/80 hover:bg-white/5"
                      : "border-line/60 text-muted/60"
                  )}
                >
                  {!allowed && <Lock size={10} />}
                  {e}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between text-xs text-txt/90">
              চোখের পলক (blink)
              <Toggle checked={settings.blinkEnabled} onChange={(v) => patch({ blinkEnabled: v })} />
            </label>
            <label className="flex items-center justify-between text-xs text-txt/90">
              সাবটাইটেল দেখাও
              <Toggle checked={settings.showSubtitles} onChange={(v) => patch({ showSubtitles: v })} />
            </label>
          </div>
        </Card>

        {/* ── Animations ── */}
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle>🕺 অ্যানিমেশন</SectionTitle>
            {!f.canAccessAllAnimations && <LockedTag />}
          </div>
          <div className="space-y-3">
            <AnimRow name="breathing" label="Breathing (নিঃশ্বাস)" locked={false} enabled />
            <AnimRow
              name="head-sway" label="Head sway (মাথা দোলা)" locked={!f.canAccessAllAnimations}
              enabled={settings.enabledAnimations.includes("head-sway")}
            />
            <AnimRow
              name="shoulder-bob" label="Shoulder bob (কাঁধ)" locked={!f.canAccessAllAnimations}
              enabled={settings.enabledAnimations.includes("shoulder-bob")}
            />
            <label className="flex items-center justify-between text-xs text-txt/90">
              Thinking pose (ভাবার ভঙ্গি)
              <Toggle checked={settings.thinkingPoseEnabled} onChange={(v) => patch({ thinkingPoseEnabled: v })} />
            </label>
          </div>
        </Card>

        {/* ── AI Provider ── */}
        <Card>
          <div className="flex items-center justify-between">
            <SectionTitle hint="নিজের OpenRouter key দিলে সেটা দিয়েই উত্তর আসবে">
              🤖 AI প্রোভাইডার
            </SectionTitle>
            {!f.canUseCustomApiKey && <LockedTag />}
          </div>

          {!f.canUseCustomApiKey ? (
            <div className="rounded-xl border border-dashed border-line p-4 text-center">
              <KeyRound size={20} className="mx-auto mb-2 text-muted" />
              <p className="text-xs text-muted">কাস্টম API key শুধু সাবস্ক্রাইবারদের জন্য</p>
              <Link href="/subscription" className="btn-primary mt-3 inline-flex items-center gap-1.5 !py-2 text-xs">
                <Crown size={13} /> আপগ্রেড করো
              </Link>
            </div>
          ) : settings.customAi ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-ok/30 bg-ok/5 px-3.5 py-3">
                <div>
                  <p className="font-mono text-xs text-ok">{settings.customAi.maskedKey}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{settings.customAi.model}</p>
                </div>
                <Badge tone="green">সেভ হয়ে আছে</Badge>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost flex-1 text-xs"
                  onClick={() => {
                    setTesting(true);
                    setTimeout(() => {
                      setTesting(false);
                      showToast("Key কাজ করছে ✅ (ডেমো)", "ok");
                    }, 900);
                  }}
                  disabled={testing}
                >
                  {testing ? "টেস্ট হচ্ছে…" : "টেস্ট করো"}
                </button>
                <button
                  className="btn-ghost flex-1 text-xs !text-err/90"
                  onClick={() => {
                    removeCustomAi();
                    showToast("Key সরানো হয়েছে — সিস্টেম ডিফল্টে ফিরে গেছে");
                  }}
                >
                  সরাও
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <input
                className="input-dark font-mono text-xs"
                placeholder="sk-or-v1-…"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Select
                value={model}
                onChange={setModel}
                options={[
                  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
                  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
                  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
                  { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
                ]}
              />
              <button
                className="btn-primary w-full text-xs"
                disabled={apiKey.length < 8}
                onClick={() => {
                  saveCustomAi(model);
                  setApiKey("");
                  showToast("API key সেভ হয়েছে 🔐 (এনক্রিপ্টেড ডেমো)");
                }}
              >
                সেভ করো
              </button>
            </div>
          )}
        </Card>

        {/* ── History ── */}
        <HistorySection max={f.maxConversationHistory} />

        {/* ── Subscription ── */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <SectionTitle>💎 সাবস্ক্রিপশন</SectionTitle>
              <p className="text-xs text-muted">
                {user.role === "public_user"
                  ? "ফ্রি প্ল্যান — দিনে ৫০টা মেসেজ, বেসিক ফিচার"
                  : user.role === "subscriber"
                  ? "সাবস্ক্রাইবার — সব প্রিমিয়াম ফিচার আনলকড 🎉"
                  : "অ্যাডমিন — সবকিছু আনলকড"}
              </p>
            </div>
            {user.role === "public_user" && (
              <Link href="/subscription" className="btn-primary flex shrink-0 items-center gap-1.5 text-xs">
                <Crown size={13} /> আপগ্রেড
              </Link>
            )}
          </div>
        </Card>

        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="btn-ghost w-full !text-err/90"
        >
          লগআউট
        </button>
      </div>
    </main>
  );
}

function AnimRow({
  name, label, locked, enabled,
}: {
  name: string; label: string; locked: boolean; enabled: boolean;
}) {
  const toggleAnimation = useSettings((s) => s.toggleAnimation);
  const showToast = useUi((s) => s.showToast);
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-xs", locked ? "text-muted" : "text-txt/90")}>{label}</span>
      <div className="flex items-center gap-2">
        {locked && <LockedTag />}
        <Toggle
          checked={enabled}
          disabled={locked || name === "breathing"}
          onChange={() => toggleAnimation(name)}
        />
      </div>
    </div>
  );
}

function HistorySection({ max }: { max: number }) {
  const router = useRouter();
  const conversations = useChat((s) => s.conversations);
  const deleteConversation = useChat((s) => s.deleteConversation);
  const clearAll = useChat((s) => s.clearAll);
  const showToast = useUi((s) => s.showToast);

  const visible = max >= 0 ? conversations.slice(0, max) : conversations;
  const hidden = conversations.length - visible.length;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionTitle hint="কখন কী চ্যাট করেছ — সব এখানে">🕓 চ্যাট হিস্টোরি</SectionTitle>
        {conversations.length > 0 && (
          <button
            className="mb-4 text-[11px] text-err/80 hover:text-err"
            onClick={() => {
              clearAll();
              showToast("সব হিস্টোরি মুছে গেছে");
            }}
          >
            সব মুছে দাও
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-6 text-center text-xs text-muted">
          এখনও কোনো কথাবার্তা নেই — চ্যাট পেজে গিয়ে কথা বলো!
        </p>
      ) : (
        <div className="space-y-1.5">
          {visible.map((c) => (
            <div
              key={c.id}
              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white/[0.02] px-3.5 py-3 transition hover:border-accent/40 hover:bg-accent/[0.04]"
              onClick={() => router.push(`/chat?c=${c.id}`)}
            >
              <HistoryIcon size={15} className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-txt/90">{c.title}</p>
                <p className="text-[10.5px] text-muted">
                  {c.messageCount} মেসেজ · {timeAgo(c.updatedAt)}
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-err/10 hover:text-err group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(c.id);
                  showToast("কথাবার্তা মুছে গেছে");
                }}
              >
                <Trash2 size={13} />
              </button>
              <ChevronRight size={14} className="shrink-0 text-muted" />
            </div>
          ))}
          {hidden > 0 && (
            <p className="pt-1 text-center text-[11px] text-muted">
              + আরও {hidden}টা পুরনো কথাবার্তা (ফ্রি প্ল্যান লিমিট)
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
