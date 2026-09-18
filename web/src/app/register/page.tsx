"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { useT } from "@/lib/i18n";
import { useUi } from "@/lib/store/framing";

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const user = useAuth((s) => s.user);
  const register = useAuth((s) => s.register);
  const showToast = useUi((s) => s.showToast);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) return <div className="h-dvh bg-bg" />;

  const submit = async () => {
    const e = email.trim();
    if (!name.trim()) return setErr(t("name") + "?");
    if (!e.includes("@")) return setErr(t("email") + "?");
    if (pass.length < 6) return setErr("Password: 6+ characters");
    if (pass !== pass2) return setErr("Passwords do not match");
    setBusy(true);
    try {
      await register(name.trim(), e, pass);
      router.push("/chat");
    } catch (ex: any) {
      setBusy(false);
      setErr(
        ex?.data?.error === "email_taken" ? "Email already registered" : "Could not create account"
      );
      showToast(ex?.data?.error ?? "error", "err");
    }
  };

  return (
    <AuthShell kind="register">
      <div className="space-y-2.5">
        <input className="input-dark" placeholder={t("name")} value={name} onChange={(ev) => setName(ev.target.value)} />
        <input className="input-dark" placeholder={t("email")} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} />
        <input className="input-dark" placeholder={t("password")} type="password" value={pass} onChange={(ev) => setPass(ev.target.value)} />
        <input
          className="input-dark" placeholder={t("password")} type="password" value={pass2}
          onChange={(ev) => setPass2(ev.target.value)}
          onKeyDown={(ev) => ev.key === "Enter" && submit()}
        />
      </div>
      {err && <p className="mt-2 text-xs text-err">{err}</p>}
      <button onClick={submit} disabled={busy} className="btn-primary mt-4 w-full">
        {busy ? "…" : t("createAccount")}
      </button>
    </AuthShell>
  );
}
