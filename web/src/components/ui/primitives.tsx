"use client";
import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("glass p-5", className)}>{children}</div>;
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-txt">{children}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "purple" | "green" | "red" | "yellow";
}) {
  const tones: Record<string, string> = {
    default: "bg-white/10 text-txt/80 border-line",
    purple: "bg-accent/15 text-accent border-accent/30",
    green: "bg-ok/10 text-ok border-ok/30",
    red: "bg-err/10 text-err border-err/30",
    yellow: "bg-warn/10 text-warn border-warn/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function LockedTag() {
  return (
    <Badge tone="purple">
      <Lock size={10} /> Subscriber
    </Badge>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-accent" : "bg-white/12",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={cn(
        "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-accent",
        "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(167,139,250,0.6)]",
        disabled && "cursor-not-allowed opacity-40"
      )}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn("input-dark appearance-none", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#141414]">
          {o.label}
        </option>
      ))}
    </select>
  );
}
