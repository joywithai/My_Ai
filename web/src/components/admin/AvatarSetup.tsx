"use client";
import { Save, RotateCcw, Eye, Lock } from "lucide-react";
import AvatarStage from "@/components/avatar/AvatarStage";
import { Card, SectionTitle, Badge } from "@/components/ui/primitives";
import { useFraming, DEFAULT_FRAMING } from "@/lib/store/framing";
import { useUi } from "@/lib/store/framing";
import { AvatarFraming } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESETS: { id: string; label: string; value: AvatarFraming }[] = [
  { id: "close", label: "ক্লোজ-আপ 😊", value: { targetY: 1.44, camY: 1.46, camZ: 1.05, fov: 30 } },
  { id: "portrait", label: "পোর্ট্রেট (চেস্ট-আপ)", value: { targetY: 1.3, camY: 1.34, camZ: 1.85, fov: 33 } },
  { id: "full", label: "ফুল বডি 🧍", value: { targetY: 0.95, camY: 1.0, camZ: 3.2, fov: 36 } },
];

export default function AvatarSetup() {
  const { framing, locked, setFraming, saveLock, reset } = useFraming();
  const showToast = useUi((s) => s.showToast);

  const activePreset = PRESETS.find(
    (p) =>
      Math.abs(p.value.camZ - framing.camZ) < 0.03 &&
      Math.abs(p.value.camY - framing.camY) < 0.03 &&
      Math.abs(p.value.targetY - framing.targetY) < 0.03
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* live preview */}
      <Card className="!p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-txt/90">
            <Eye size={14} className="text-accent" /> লাইভ প্রিভিউ
          </span>
          <Badge tone={locked ? "green" : "yellow"}>
            {locked ? (
              <>
                <Lock size={10} /> লক করা — সব ইউজার এই ভিউ পাবে
              </>
            ) : (
              "সেভ করা হয়নি"
            )}
          </Badge>
        </div>
        <div className="h-[420px] rounded-b-2xl bg-[radial-gradient(400px_300px_at_50%_20%,rgba(167,139,250,0.05),transparent)]">
          <AvatarStage mode="preview" />
        </div>
      </Card>

      {/* controls */}
      <div className="space-y-4">
        <Card>
          <SectionTitle hint="যেভাবে সেট করবে, মেইন পেজে লগইনের পর অ্যাভাটার সেভাবেই দেখাবে">
            ক্যামেরা ফ্রেমিং
          </SectionTitle>

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

          <FramingSlider
            label="লুক-অ্যাট উচ্চতা (কোথায় তাকাবে)" unit="m"
            min={0.9} max={1.6} step={0.01}
            value={framing.targetY} onChange={(v) => setFraming({ targetY: v })}
          />
          <FramingSlider
            label="ক্যামেরা উচ্চতা" unit="m"
            min={0.8} max={1.8} step={0.01}
            value={framing.camY} onChange={(v) => setFraming({ camY: v })}
          />
          <FramingSlider
            label="দূরত্ব (কাছে/দূরে)" unit="m"
            min={0.6} max={3.2} step={0.05}
            value={framing.camZ} onChange={(v) => setFraming({ camZ: v })}
          />
          <FramingSlider
            label="FOV (লেন্স)" unit="°"
            min={20} max={55} step={1}
            value={framing.fov} onChange={(v) => setFraming({ fov: v })}
          />

          <div className="mt-4 flex gap-2">
            <button
              className="btn-primary flex flex-1 items-center justify-center gap-1.5 text-xs"
              onClick={() => {
                saveLock();
                showToast("সেভ হলো ✅ মেইন পেজে অ্যাভাটার এই ভিউতেই আসবে");
              }}
            >
              <Save size={14} /> সেভ ও লক
            </button>
            <button
              className="btn-ghost !px-3"
              title="রিসেট"
              onClick={() => {
                reset();
                showToast("ডিফল্ট ফ্রেমিংয়ে ফিরে গেছে", "info");
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </Card>

        <Card className="!border-dashed">
          <p className="text-[11px] leading-relaxed text-muted">
            💡 <b className="text-txt/80">যেভাবে কাজ করে:</b> স্লাইডার নাড়ালেই পাশের প্রিভিউতে সাথে সাথে
            পরিবর্তন দেখা যায়। পছন্দ হলে <b className="text-accent">সেভ ও লক</b> চাপো — তখন থেকে সব
            ইউজার লগইনের পর অ্যাভাটার ঠিক এই position/framing এই দেখবে, তারা নিজেরা বদলাতে পারবে না।
            (ডেমোতে ব্রাউজারে সেভ হয় — ব্যাকএন্ডে <code className="font-mono text-accent">system_settings</code> টেবিলে যাবে।)
          </p>
        </Card>
      </div>
    </div>
  );
}

function FramingSlider({
  label, unit, min, max, step, value, onChange,
}: {
  label: string; unit: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3.5">
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
