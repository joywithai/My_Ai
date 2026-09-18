"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarStage from "@/components/avatar/AvatarStage";
import { useAuth } from "@/lib/store/auth";

export default function LandingPage() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) {
    return <div className="h-dvh bg-bg" />;
  }

  return (
    <main className="mx-auto flex h-dvh max-w-[1000px] flex-col px-4">
      {/* top bar — only login/signup buttons */}
      <div className="flex h-14 items-center justify-end gap-2">
        <Link href="/register" className="btn-ghost !py-2 text-xs">
          সাইনআপ
        </Link>
        <Link href="/login" className="btn-primary !py-2 text-xs">
          লগইন
        </Link>
      </div>

      {/* avatar box — শুধু avatar, আর কিছু না */}
      <div className="relative my-2 min-h-0 flex-1 overflow-hidden rounded-2xl border border-line">
        <AvatarStage mode="landing" />
      </div>
    </main>
  );
}
