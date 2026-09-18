"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Users, SlidersHorizontal, Flag } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { cn } from "@/lib/utils";
import AvatarSetup from "@/components/admin/AvatarSetup";
import UsersTable from "@/components/admin/UsersTable";
import FlagsEditor from "@/components/admin/FlagsEditor";

type Tab = "avatar" | "users" | "flags";

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && (!user || user.role !== "admin")) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || !user || user.role !== "admin") {
    return <div className="h-dvh bg-bg" />;
  }
  return <AdminInner />;
}

function AdminInner() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("avatar");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "avatar", label: "অ্যাভাটার সেটআপ", icon: <SlidersHorizontal size={14} /> },
    { id: "users", label: "ইউজারস", icon: <Users size={14} /> },
    { id: "flags", label: "ফিচার ফ্ল্যাগস", icon: <Flag size={14} /> },
  ];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-4 pb-16">
      <div className="flex h-14 items-center gap-3">
        <button onClick={() => router.push("/chat")} className="btn-ghost !p-2">
          <ArrowLeft size={17} />
        </button>
        <h1 className="flex items-center gap-2 text-[15px] font-bold">
          <ShieldCheck size={16} className="text-err" /> অ্যাডমিন প্যানেল
        </h1>
      </div>

      {/* tabs */}
      <div className="glass mb-4 flex gap-1 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              tab === t.id ? "bg-accent text-[#16101f]" : "text-muted hover:text-txt"
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "avatar" && <AvatarSetup />}
      {tab === "users" && <UsersTable />}
      {tab === "flags" && <FlagsEditor />}
    </main>
  );
}
