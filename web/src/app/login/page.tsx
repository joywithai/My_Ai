"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { useT } from "@/lib/i18n";
import { useUi } from "@/lib/store/framing";
import { cn } from "@/lib/utils";

const DEMO = [
  { email: "admin@demo.com", pass: "admin123", label: "Admin" },
  { email: "sub@demo.com", pass: "sub12345", label: "Subscriber" },
  { email: "public@demo.com", pass: "public123", label: "Public" },
];

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const showToast = useUi((s) => s.showToast);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) return <div className="h-dvh bg-bg" />;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await login(email.trim(), pass);
      router.push("/chat");
    } catch (e: any) {
      setBusy(false);
      showToast(
        e?.data?.error === "banned" ? "This account is banned" : "Wrong email or password",
        "err"
      );
    }
  };

  return (
    <AuthShell kind="login">
      <div className="space-y-2.5">
        <input
          className="input-dark"
          placeholder={t("email")}
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <input
          className="input-dark"
          placeholder={t("password")}
          type="password"
          value={pass}
          onChange={(ev) => setPass(ev.target.value)}
          onKeyDown={(ev) => ev.key === "Enter" && submit()}
        />
      </div>
      <button onClick={submit} disabled={busy} className="btn-primary mt-4 w-full">
        {busy ? "…" : t("signIn")}
      </button>
      <div className="mt-4">
        <p className="mb-1.5 text-[10.5px] uppercase tracking-wide text-muted">{t("demoAccounts")}</p>
        <div className="grid grid-cols-3 gap-1.5">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPass(d.pass);
              }}
              className={cn(
                "rounded-lg border border-line px-2 py-2 text-[11px] font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
