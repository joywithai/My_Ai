"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, UserRound, Volume2, Smile, PersonStanding, Cpu,
  History as HistoryIcon, Crown, Lock, Trash2, ChevronRight, Play,
  KeyRound, Save, RotateCcw, LogOut, Eye, Check,
} from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { useSettings } from "@/lib/store/settings";
import { useChat } from "@/lib/store/chat";
import { useUi, useFraming, DEFAULT_FRAMING } from "@/lib/store/framing";
import { Badge, Toggle, Slider, Select, LockedTag } from "@/components/ui/primitives";
import AvatarStage from "@/components/avatar/AvatarStage";
import { ROLE_LABEL, AvatarFraming } from "@/lib/types";
import { BANGLA_VOICES, ENGLISH_VOICES } from "@/lib/mock/data";
import { demoSpeak, hasVoiceFor } from "@/lib/speak";
import { cn, timeAgo } from "@/lib/utils";

type Tab = "account" | "voice" | "face" | "avatar" | "ai" | "history";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "প্রোফাইল", icon: <UserRound size={15} /> },
  { id: "voice", label: "ভয়েস", icon: <Volume2 size={15} /> },
  { id: "face", label: "চেহারা", icon: <Smile size={15} /> },
  { id: "avatar", label: "অ্যাভাটার", icon: <PersonStanding size={15} /> },
  { id: "ai", label: "AI", icon: <Cpu size={15} /> },
  { id: "history", label: "হিস্টোরি", icon: <HistoryIcon size={15} /> },
];

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
  const [tab, setTab] = useState<Tab>("account");

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-4 pb-14">
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

      <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
        {/* tab nav */}
        <aside className="lg:sticky lg:top-4 lg:h-fit">
          <nav className="glass flex gap-1 overflow-x-auto p-1.5 lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium transition-all",
                  tab === t.id
                    ? "bg-accent-dim text-accent"
                    : "text-muted hover:bg-white/5 hover:text-txt"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* content */}
        <section className="min-w-0">
          {tab === "account" && <AccountTab />}
          {tab === "voice" && <VoiceTab />}
          {tab === "face" && <FaceTab />}
          {tab === "avatar" && <AvatarTab />}
          {tab === "ai" && <AiTab />}
          {tab === "history" && <HistoryTab />}
        </section>
      </div>
    </main>
  );
}

/* ───────── shared pieces ───────── */

function Section({
  icon, title, desc, children, action,
}: {
  icon: React.ReactNode; title: string; desc?: string;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="glass mb-4 p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[14.5px] font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-dim text-accent">
              {icon}
            </span>
            {title}
          </h2>
          {desc && <p className="mt-1.5 pl-10 text-[11.5px] leading-relaxed text-muted">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({
  label, desc, control, locked, disabled,
}: {
  label: string; desc?: string; control: React.ReactNode;
  locked?: boolean; disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-line/50 py-3.5 last:border-0", disabled && "opacity-45")}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-txt/90">
          {label}
          {locked && <LockedTag />}
        </p>
        {desc && <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{desc}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/* ───────── account ───────── */

function AccountTab() {
  const router = useRouter();
  const user = useAuth((s) => s.user)!;
  const logout = useAuth((s) => s.logout);
  const showToast = useUi((s) => s.showToast);
  const [name, setName] = useState(user.name);

  return (
    <>
      <Section icon={<UserRound size={15} />} title="প্রোফাইল">
        <div className="mb-4 flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-xl font-bold text-accent">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
        </div>
        <Row
          label="ডিসপ্লে নাম"
          control={
            <div className="flex gap-2">
              <input className="input-dark !w-[180px]" value={name} onChange={(e) => setName(e.target.value)} />
              <button
                className="btn-ghost !py-2 text-xs"
                onClick={() => {
                  useAuth.getState().updateProfile(name.trim() || user.name);
                  showToast("নাম আপডেট হয়েছে ✅");
                }}
              >
                সেভ
              </button>
            </div>
          }
        />
        <Row label="রোল" control={<Badge tone={user.role === "admin" ? "red" : user.role === "subscriber" ? "purple" : "default"}>{ROLE_LABEL[user.role]}</Badge>} />
      </Section>

      <Section icon={<Crown size={15} />} title="সাবস্ক্রিপশন">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs leading-relaxed text-muted">
            {user.role === "public_user"
              ? "ফ্রি প্ল্যান — দিনে ৫০ মেসেজ, বেসিক ফিচার"
              : "সব প্রিমিয়াম ফিচার আনলকড আছে 🎉"}
          </p>
          {user.role === "public_user" && (
            <Link href="/subscription" className="btn-primary shrink-0 !py-2 text-xs">
              <Crown size={13} className="mr-1 inline" /> আপগ্রেড
            </Link>
          )}
        </div>
      </Section>

      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="btn-ghost flex w-full items-center justify-center gap-2 !text-err/90"
      >
        <LogOut size={14} /> লগআউট
      </button>
    </>
  );
}

/* ───────── voice ───────── */

function VoiceTab() {
  const { settings, flags, patch } = useSettings();
  const user = useAuth((s) => s.user)!;
  const showToast = useUi((s) => s.showToast);
  const f = flags[user.role];
  const voices = settings.language === "bn" ? BANGLA_VOICES : ENGLISH_VOICES;

  return (
    <Section
      icon={<Volume2 size={15} />}
      title="ভয়েস"
      desc={hasVoiceFor(settings.language) ? "ডেমোতে ব্রাউজারের TTS ব্যবহার হয় — ব্যাকএন্ডে Edge-TTS neural voice আসবে" : "এই ব্রাউজারে বাংলা ভয়েস নেই — ইংরেজিতে টেস্ট করো"}
    >
      <Row
        label="ভাষা"
        control={
          <div className="flex overflow-hidden rounded-xl border border-line">
            {(["bn", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() =>
                  patch({
                    language: l,
                    voiceName: l === "bn" ? BANGLA_VOICES[0].name : ENGLISH_VOICES[0].name,
                  })
                }
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all",
                  settings.language === l ? "bg-accent text-[#16101f]" : "text-muted hover:text-txt"
                )}
              >
                {l === "bn" ? "বাংলা" : "EN"}
              </button>
            ))}
          </div>
        }
      />
      <Row
        label="ভয়েস"
        control={
          <Select
            className="!w-[190px]"
            value={settings.voiceName}
            onChange={(v) => patch({ voiceName: v })}
            options={voices.map((v) => ({ value: v.name, label: v.displayName }))}
          />
        }
      />
      <Row
        label={`স্পিড — ${settings.voiceSpeed.toFixed(2)}x`}
        locked={!f.canCustomizeVoice}
        control={
          <div className="w-[170px]">
            <Slider min={0.5} max={2} step={0.05} value={settings.voiceSpeed} disabled={!f.canCustomizeVoice} onChange={(v) => patch({ voiceSpeed: v })} />
          </div>
        }
      />
      <Row
        label={`পিচ — ${settings.voicePitch > 0 ? `+${settings.voicePitch}` : settings.voicePitch}`}
        locked={!f.canCustomizeVoice}
        control={
          <div className="w-[170px]">
            <Slider min={-50} max={50} step={1} value={settings.voicePitch} disabled={!f.canCustomizeVoice} onChange={(v) => patch({ voicePitch: v })} />
          </div>
        }
      />
      <Row
        label="ডেমো ভয়েস"
        desc="চ্যাটে উত্তরের সাথে ব্রাউজার TTS বাজবে"
        control={<Toggle checked={settings.demoVoiceOn} onChange={(v) => patch({ demoVoiceOn: v })} />}
      />
      <Row
        label="অটো প্লে"
        desc="উত্তর আসলেই ভয়েস চালু হবে"
        control={<Toggle checked={settings.autoPlayAudio} onChange={(v) => patch({ autoPlayAudio: v })} />}
      />
      <div className="pt-3">
        <button
          className="btn-ghost flex items-center gap-1.5 text-xs"
          onClick={() => {
            const ok = demoSpeak(
              settings.language === "bn" ? "আমি MyAi, তোমার বন্ধু।" : "I am MyAi, your friend.",
              settings.language, settings.voiceSpeed, settings.voicePitch
            );
            if (!ok) showToast("এই ব্রাউজারে কোনো ভয়েস পাওয়া যায়নি", "err");
          }}
        >
          <Play size={12} /> ভয়েস টেস্ট
        </button>
      </div>
    </Section>
  );
}

/* ───────── face + motion ───────── */

const PUBLIC_EXPRS = ["neutral", "happy", "sad", "surprised"];
const ALL_EXPRS = [...PUBLIC_EXPRS, "relaxed", "excited", "friendly", "serious", "thoughtful", "confused", "concerned", "angry"];

const EXPR_EMOJI: Record<string, string> = {
  neutral: "🙂", happy: "😊", sad: "😢", surprised: "😲", relaxed: "😌",
  excited: "🤩", friendly: "🤗", serious: "😐", thoughtful: "🤔",
  confused: "🤨", concerned: "🙁", angry: "😠",
};

function FaceTab() {
  const { settings, flags, patch, setExpression, toggleAnimation } = useSettings();
  const user = useAuth((s) => s.user)!;
  const showToast = useUi((s) => s.showToast);
  const f = flags[user.role];
  const exprList = f.canAccessAllExpressions ? ALL_EXPRS : PUBLIC_EXPRS;

  return (
    <>
      <Section icon={<Smile size={15} />} title="এক্সপ্রেশন" desc="avatar এর ডিফল্ট মুখের ভাব">
        <div className="flex flex-wrap gap-1.5">
          {ALL_EXPRS.map((e) => {
            const allowed = exprList.includes(e);
            return (
              <button
                key={e}
                onClick={() =>
                  allowed
                    ? setExpression(e)
                    : showToast("সব এক্সপ্রেশনের জন্য সাবস্ক্রাইব করো ✨", "info")
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11.5px] font-medium capitalize transition",
                  settings.defaultExpression === e
                    ? "border-accent/60 bg-accent-dim text-accent"
                    : allowed
                    ? "border-line text-txt/80 hover:bg-white/5"
                    : "border-line/60 text-muted/60"
                )}
              >
                <span className="text-sm leading-none">{EXPR_EMOJI[e]}</span>
                {e}
                {!allowed && <Lock size={10} />}
              </button>
            );
          })}
        </div>
        <div className="mt-2">
          <Row label="চোখের পলক (blink)" control={<Toggle checked={settings.blinkEnabled} onChange={(v) => patch({ blinkEnabled: v })} />} />
          <Row label="সাবটাইটেল" desc="কথা বলার সময় লেখা দেখাবে" control={<Toggle checked={settings.showSubtitles} onChange={(v) => patch({ showSubtitles: v })} />} />
        </div>
      </Section>

      <Section icon={<PersonStanding size={15} />} title="নড়াচড়া">
        <Row label="Breathing (নিঃশ্বাস)" desc="সবসময় চালু — বুক ওঠানামা" control={<Toggle checked disabled onChange={() => {}} />} />
        <Row
          label="Head sway (মাথা দোলা)"
          locked={!f.canAccessAllAnimations}
          control={<Toggle checked={settings.enabledAnimations.includes("head-sway")} disabled={!f.canAccessAllAnimations} onChange={() => toggleAnimation("head-sway")} />}
        />
        <Row
          label="Shoulder bob (কাঁধ)"
          locked={!f.canAccessAllAnimations}
          control={<Toggle checked={settings.enabledAnimations.includes("shoulder-bob")} disabled={!f.canAccessAllAnimations} onChange={() => toggleAnimation("shoulder-bob")} />}
        />
        <Row
          label="Thinking effect"
          desc="ভাবার সময় চোখ উপরে + ??? বুদবুদ 🫧"
          control={<Toggle checked={settings.thinkingPoseEnabled} onChange={(v) => patch({ thinkingPoseEnabled: v })} />}
        />
      </Section>
    </>
  );
}

/* ───────── avatar position (with preview) ───────── */

const PRESETS: { id: string; label: string; value: AvatarFraming }[] = [
  { id: "close", label: "ক্লোজ-আপ 😊", value: { targetY: 1.44, camY: 1.46, camZ: 1.05, fov: 30 } },
  { id: "portrait", label: "বুক পর্যন্ত", value: { targetY: 1.43, camY: 1.46, camZ: 1.4, fov: 33 } },
  { id: "full", label: "ফুল বডি 🧍", value: { targetY: 0.95, camY: 1.0, camZ: 3.2, fov: 36 } },
];

function AvatarTab() {
  const user = useAuth((s) => s.user)!;
  const { framing, locked, setFraming, saveLock, reset } = useFraming();
  const showToast = useUi((s) => s.showToast);
  const isAdmin = user.role === "admin";

  const activePreset = PRESETS.find(
    (p) =>
      Math.abs(p.value.camZ - framing.camZ) < 0.03 &&
      Math.abs(p.value.camY - framing.camY) < 0.03 &&
      Math.abs(p.value.targetY - framing.targetY) < 0.03
  );

  return (
    <Section
      icon={<Eye size={15} />}
      title="অ্যাভাটার পজিশন"
      desc="অ্যাডমিন যেভাবে সেট করবে, সব ইউজারের মেইন পেজে অ্যাভাটার সেভাবেই লক থাকবে"
      action={
        <Badge tone={locked ? "green" : isAdmin ? "yellow" : "default"}>
          {locked ? (
            <>
              <Lock size={10} /> লক করা
            </>
          ) : isAdmin ? (
            "সেভ করা হয়নি"
          ) : (
            "admin control"
          )}
        </Badge>
      }
    >
      {/* live preview */}
      <div className="mb-4 h-[300px] overflow-hidden rounded-xl border border-line bg-[radial-gradient(400px_260px_at_50%_25%,rgba(167,139,250,0.05),transparent)]">
        <AvatarStage mode="preview" />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setFraming(p.value)}
            className={cn(
              "rounded-lg border px-2 py-2 text-[10.5px] font-semibold transition",
              activePreset?.id === p.id
                ? "border-accent/60 bg-accent-dim text-accent"
                : "border-line text-muted hover:text-txt"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <FramingSlider label="লুক-অ্যাট উচ্চতা" unit="m" min={0.9} max={1.6} step={0.01} value={framing.targetY} onChange={(v) => setFraming({ targetY: v })} />
      <FramingSlider label="ক্যামেরা উচ্চতা" unit="m" min={0.8} max={1.8} step={0.01} value={framing.camY} onChange={(v) => setFraming({ camY: v })} />
      <FramingSlider label="দূরত্ব" unit="m" min={0.6} max={3.2} step={0.05} value={framing.camZ} onChange={(v) => setFraming({ camZ: v })} />
      <FramingSlider label="FOV (লেন্স)" unit="°" min={20} max={55} step={1} value={framing.fov} onChange={(v) => setFraming({ fov: v })} />

      <div className="mt-4 flex gap-2">
        {isAdmin ? (
          <>
            <button
              className="btn-primary flex flex-1 items-center justify-center gap-1.5 text-xs"
              onClick={() => {
                saveLock();
                showToast("সেভ হলো ✅ মেইন পেজে অ্যাভাটার এই ভিউতেই আসবে");
              }}
            >
              <Save size={14} /> সেভ ও লক
            </button>
            <button className="btn-ghost !px-3" title="রিসেট" onClick={() => { reset(); showToast("ডিফল্টে ফিরে গেছে", "info"); }}>
              <RotateCcw size={14} />
            </button>
          </>
        ) : (
          <p className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-[11px] text-muted">
            <Lock size={12} className="text-accent" />
            পজিশন সেট করা শুধু অ্যাডমিনের জন্য — তুমি প্রিভিউ দেখতে পারো
          </p>
        )}
      </div>
    </Section>
  );
}

function FramingSlider({
  label, unit, min, max, step, value, onChange,
}: {
  label: string; unit: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-accent">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
          [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(167,139,250,0.6)]"
      />
    </div>
  );
}

/* ───────── AI provider ───────── */

type ProviderId = "gemini" | "openrouter";

const AI_PROVIDERS: {
  id: ProviderId;
  name: string;
  desc: string;
  baseUrl: string;
  models: string[];
  keyPlaceholder: string;
}[] = [
  {
    id: "gemini",
    name: "Gemini",
    desc: "সরাসরি Google AI Studio key",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/",
    models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
    keyPlaceholder: "AIza…",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    desc: "এক key-তে সব মডেল",
    baseUrl: "https://openrouter.ai/api/v1/",
    models: [
      "openrouter/free",
      "google/gemini-2.0-flash-001",
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "meta-llama/llama-3.1-70b-instruct",
    ],
    keyPlaceholder: "sk-or-v1-…",
  },
];

function AiTab() {
  const { settings, flags, saveCustomAi, removeCustomAi } = useSettings();
  const user = useAuth((s) => s.user)!;
  const showToast = useUi((s) => s.showToast);
  const f = flags[user.role];
  const saved = settings.customAi;

  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState<ProviderId>(saved?.provider ?? "gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(saved?.model ?? "gemini-2.5-flash");
  const [baseUrl, setBaseUrl] = useState(saved?.baseUrl ?? AI_PROVIDERS[0].baseUrl);
  const [temperature, setTemperature] = useState(saved?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(saved?.maxOutputTokens ?? 2048);
  const [testing, setTesting] = useState(false);

  const pickProvider = (id: ProviderId) => {
    setProvider(id);
    const p = AI_PROVIDERS.find((x) => x.id === id)!;
    setModel(p.models[0]);
    setBaseUrl(p.baseUrl);
  };

  const showForm = !saved || editing;

  return (
    <Section
      icon={<Cpu size={15} />}
      title="AI প্রোভাইডার"
      desc="নিজের key দিলে সেটা দিয়েই উত্তর আসবে — দুইটার যেকোনো একটা বেছে নাও"
      action={!f.canUseCustomApiKey ? <LockedTag /> : undefined}
    >
      {!f.canUseCustomApiKey ? (
        <div className="rounded-xl border border-dashed border-line p-6 text-center">
          <KeyRound size={22} className="mx-auto mb-2.5 text-muted" />
          <p className="text-xs text-muted">কাস্টম API key শুধু সাবস্ক্রাইবারদের জন্য</p>
          <Link href="/subscription" className="btn-primary mt-3.5 inline-flex items-center gap-1.5 !py-2 text-xs">
            <Crown size={13} /> আপগ্রেড করো
          </Link>
        </div>
      ) : (
        <>
          {/* provider option cards */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => showForm && pickProvider(p.id)}
                disabled={!showForm}
                className={cn(
                  "relative rounded-xl border p-3.5 text-left transition",
                  provider === p.id
                    ? "border-accent/60 bg-accent-dim shadow-[0_0_18px_rgba(167,139,250,0.12)]"
                    : "border-line hover:border-line hover:bg-white/[0.03]",
                  !showForm && "cursor-default"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={cn("text-[13px] font-bold", provider === p.id ? "text-accent" : "text-txt/85")}>
                    {p.name}
                  </span>
                  {provider === p.id && (
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent">
                      <Check size={11} strokeWidth={3} className="text-[#16101f]" />
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] leading-relaxed text-muted">{p.desc}</p>
                {saved?.provider === p.id && (
                  <span className="mt-1.5 inline-block rounded-md bg-ok/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-ok">
                    সেভ হয়ে আছে
                  </span>
                )}
              </button>
            ))}
          </div>

          {showForm ? (
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[11px] text-muted">API Key</label>
                <input
                  className="input-dark font-mono text-xs"
                  placeholder={AI_PROVIDERS.find((p) => p.id === provider)!.keyPlaceholder}
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-muted">মডেল</label>
                <Select
                  value={model}
                  onChange={setModel}
                  options={AI_PROVIDERS.find((p) => p.id === provider)!.models.map((m) => ({ value: m, label: m }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-muted">Base URL</label>
                <input
                  className="input-dark font-mono text-[11px]"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 flex justify-between text-[11px] text-muted">
                    <span>Temperature</span>
                    <span className="font-mono text-accent">{temperature.toFixed(1)}</span>
                  </label>
                  <Slider min={0} max={2} step={0.1} value={temperature} onChange={setTemperature} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted">Max Output Tokens</label>
                  <Select
                    value={String(maxTokens)}
                    onChange={(v) => setMaxTokens(parseInt(v))}
                    options={[1024, 2048, 4096, 8192].map((n) => ({ value: String(n), label: String(n) }))}
                  />
                </div>
              </div>
              <button
                className="btn-primary w-full text-xs"
                disabled={apiKey.length < 8}
                onClick={() => {
                  saveCustomAi({ provider, apiKey, model, baseUrl, temperature, maxOutputTokens: maxTokens });
                  setApiKey("");
                  setEditing(false);
                  showToast("API key সেভ হয়েছে 🔐 (এনক্রিপ্টেড ডেমো)");
                }}
              >
                সেভ করো
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-ok/30 bg-ok/5 px-4 py-3.5">
                <div>
                  <p className="font-mono text-xs text-ok">{saved!.maskedKey}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {AI_PROVIDERS.find((p) => p.id === saved!.provider)?.name ?? saved!.provider} · {saved!.model} · temp {saved!.temperature} · {saved!.maxOutputTokens} tokens
                  </p>
                </div>
                <Badge tone="green">সেভ হয়ে আছে</Badge>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost flex-1 text-xs"
                  disabled={testing}
                  onClick={() => {
                    setTesting(true);
                    setTimeout(() => {
                      setTesting(false);
                      showToast("Key কাজ করছে ✅ (ডেমো)", "ok");
                    }, 900);
                  }}
                >
                  {testing ? "টেস্ট হচ্ছে…" : "টেস্ট করো"}
                </button>
                <button className="btn-ghost flex-1 text-xs" onClick={() => setEditing(true)}>
                  পরিবর্তন করো
                </button>
                <button
                  className="btn-ghost flex-1 text-xs !text-err/90"
                  onClick={() => {
                    removeCustomAi();
                    setEditing(false);
                    showToast("Key সরানো হয়েছে — সিস্টেম ডিফল্টে ফিরে গেছে");
                  }}
                >
                  সরাও
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/* ───────── history ───────── */

function HistoryTab() {
  const router = useRouter();
  const user = useAuth((s) => s.user)!;
  const flags = useSettings((s) => s.flags);
  const max = flags[user.role].maxConversationHistory;
  const conversations = useChat((s) => s.conversations);
  const deleteConversation = useChat((s) => s.deleteConversation);
  const clearAll = useChat((s) => s.clearAll);
  const showToast = useUi((s) => s.showToast);

  const visible = max >= 0 ? conversations.slice(0, max) : conversations;
  const hidden = conversations.length - visible.length;

  return (
    <Section icon={<HistoryIcon size={15} />} title="চ্যাট হিস্টোরি" desc="কখন কী চ্যাট করেছ — সব এখানে"
      action={
        conversations.length > 0 ? (
          <button className="text-[11px] text-err/80 hover:text-err" onClick={() => { clearAll(); showToast("সব হিস্টোরি মুছে গেছে"); }}>
            সব মুছে দাও
          </button>
        ) : undefined
      }
    >
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-muted">
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
    </Section>
  );
}
