"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarStage from "@/components/avatar/AvatarStage";
import { useAuth } from "@/lib/store/auth";
import { Role, ROLE_LABEL } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { Lock } from "lucide-react";

export default function LandingPage() {
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("public_user");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) {
    return <div className="h-dvh bg-bg" />;
  }

  const submit = () => {
    const fallbackEmail = email || "demo@myai.app";
    login({
      id: uid("u"),
      name: name || fallbackEmail.split("@")[0] || "Guest",
      email: fallbackEmail,
      role,
    });
    router.push("/chat");
  };

  return (
    <main className="mx-auto flex h-dvh max-w-[1000px] flex-col px-4">
      {/* top bar — app name only */}
      <div className="flex h-14 items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo-400 text-[13px] font-black text-[#16101f]">
            M
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            My<span className="text-accent">Ai</span>
          </span>
        </div>
        <span className="ml-auto rounded-full border border-accent/30 bg-accent-dim px-2.5 py-1 text-[10px] font-medium text-accent">
          ডেমো মোড
        </span>
      </div>

      {/* avatar box */}
      <div className="glass relative mt-1 min-h-0 flex-1 overflow-hidden">
        <AvatarStage mode="landing" />
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-muted">
            <Lock size={11} className="text-accent" />
            লগইন করলেই আমি কথা বলা শুরু করবো
          </div>
        </div>
      </div>

      {/* auth card */}
      <div className="my-3">
        <div className="glass mx-auto w-full max-w-[440px] p-4 sm:p-5">
          {/* tabs */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg py-2 text-[13px] font-semibold transition-all",
                  tab === t ? "bg-accent text-[#16101f]" : "text-muted hover:text-txt"
                )}
              >
                {t === "login" ? "লগইন" : "সাইনআপ"}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {tab === "register" && (
              <input
                className="input-dark"
                placeholder="তোমার নাম"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="input-dark"
              placeholder="ইমেইল"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input-dark"
              placeholder="পাসওয়ার্ড"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {/* demo role picker */}
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] text-muted">
              ডেমো রোল (যে রোল দিয়ে ঢুকবে সেই ফিচারগুলো দেখা যাবে):
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-lg border py-2 text-[11.5px] font-semibold transition-all",
                    role === r
                      ? "border-accent/60 bg-accent-dim text-accent"
                      : "border-line text-muted hover:text-txt"
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          <button onClick={submit} className="btn-primary mt-4 w-full">
            {tab === "login" ? "লগইন করো →" : "অ্যাকাউন্ট খুলো →"}
          </button>
          <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-muted">
            ডেমোতে যেকোনো ইমেইল/পাসওয়ার্ড চলবে — ব্যাকএন্ড যুক্ত হলে আসল অথেনটিকেশন বসবে
          </p>
        </div>
      </div>
    </main>
  );
}
