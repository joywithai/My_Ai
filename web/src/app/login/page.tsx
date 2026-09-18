"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store/auth";
import { uid } from "@/lib/utils";
import { AuthShell, RolePicker, DemoRole } from "@/components/auth/AuthShell";

/** Full-page login (demo) */
export default function LoginPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState<DemoRole>("public_user");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) return <div className="h-dvh bg-bg" />;

  const submit = () => {
    const e = email.trim() || "demo@myai.app";
    login({
      id: uid("u"),
      name: e.split("@")[0] || "Guest",
      email: e,
      role,
    });
    router.push("/chat");
  };

  return (
    <AuthShell kind="login">
      <div className="space-y-2.5">
        <input
          className="input-dark"
          placeholder="ইমেইল"
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <input
          className="input-dark"
          placeholder="পাসওয়ার্ড"
          type="password"
          value={pass}
          onChange={(ev) => setPass(ev.target.value)}
          onKeyDown={(ev) => ev.key === "Enter" && submit()}
        />
      </div>
      <div className="mt-3">
        <RolePicker role={role} setRole={setRole} />
      </div>
      <button onClick={submit} className="btn-primary mt-4 w-full">
        লগইন করো →
      </button>
      <p className="mt-2.5 text-center text-[10.5px] text-muted">
        ডেমোতে যেকোনো ইমেইল/পাসওয়ার্ড চলবে
      </p>
    </AuthShell>
  );
}
