"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Settings, LogOut, Crown, ShieldCheck, UserRound, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { ROLE_LABEL } from "@/lib/types";
import { Badge } from "@/components/ui/primitives";

export default function TopBar() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;

  return (
    <header className="glass sticky top-0 z-50 mx-auto flex h-14 w-full max-w-[1000px] items-center justify-between rounded-none border-x-0 border-t-0 px-4">
      <Link href="/chat" className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo-400 text-[13px] font-black text-[#16101f]">
          M
        </div>
        <span className="text-[15px] font-bold tracking-tight">
          My<span className="text-accent">Ai</span>
        </span>
      </Link>

      <div className="flex items-center gap-2.5">
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-txt/80 transition hover:bg-white/5 hover:text-accent"
          title="সেটিংস"
        >
          <Settings size={17} />
        </Link>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-line py-1.5 pl-1.5 pr-2.5 transition hover:bg-white/5"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20 text-[11px] font-bold text-accent">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-xs font-medium sm:block">{user.name}</span>
            <ChevronDown size={13} className="text-muted" />
          </button>

          {open && (
            <div className="glass rise-in absolute right-0 top-12 w-56 overflow-hidden p-1.5 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-semibold">{user.name}</p>
                  <p className="text-[11px] text-muted">{user.email}</p>
                </div>
                <Badge tone={user.role === "admin" ? "red" : user.role === "subscriber" ? "purple" : "default"}>
                  {ROLE_LABEL[user.role]}
                </Badge>
              </div>
              <div className="my-1 h-px bg-line" />
              <MenuItem icon={<UserRound size={14} />} label="প্রোফাইল" onClick={() => { setOpen(false); router.push("/settings"); }} />
              <MenuItem icon={<Crown size={14} />} label="সাবস্ক্রিপশন" onClick={() => { setOpen(false); router.push("/subscription"); }} />
              {user.role === "admin" && (
                <MenuItem icon={<ShieldCheck size={14} />} label="অ্যাডমিন প্যানেল" onClick={() => { setOpen(false); router.push("/admin"); }} />
              )}
              <div className="my-1 h-px bg-line" />
              <MenuItem
                icon={<LogOut size={14} />}
                label="লগআউট"
                danger
                onClick={() => {
                  setOpen(false);
                  logout();
                  router.push("/");
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-white/5 ${
        danger ? "text-err/90" : "text-txt/90"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
