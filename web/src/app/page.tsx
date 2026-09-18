"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarStage from "@/components/avatar/AvatarStage";
import { useAuth } from "@/lib/store/auth";
import { useSettings } from "@/lib/store/settings";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const t = useT();
  const uiLang = useSettings((s) => s.settings.uiLanguage ?? "en");
  const patch = useSettings((s) => s.patch);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) {
    return <div className="h-dvh bg-bg" />;
  }

  return (
    <main className="mx-auto flex h-dvh max-w-[1000px] flex-col px-4">
      {/* top bar — app name + BN/EN toggle */}
      <div className="flex h-14 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo-400 text-[13px] font-black text-[#16101f]">
            M
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            My<span className="text-accent">Ai</span>
          </span>
        </div>

        <div className="flex overflow-hidden rounded-xl border border-line">
          {(["en", "bn"] as const).map((l) => (
            <button
              key={l}
              onClick={() => patch({ uiLanguage: l })}
              className={cn(
                "px-3 py-2 text-xs font-bold transition-all",
                uiLang === l ? "bg-accent text-[#16101f]" : "text-muted hover:text-txt"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* avatar frame — buttons overlay the bottom */}
      <div className="relative my-2 mb-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-line">
        <AvatarStage mode="landing" />

        {/* login / signup — bottom center, on the frame */}
        <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2.5">
          <Link href="/register" className="btn-ghost !px-5 !py-2.5 text-xs backdrop-blur-md">
            {t("signup")}
          </Link>
          <Link href="/login" className="btn-primary !px-6 !py-2.5 text-xs">
            {t("login")}
          </Link>
        </div>
      </div>
    </main>
  );
}
