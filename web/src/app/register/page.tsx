"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/store/auth";
import { uid } from "@/lib/utils";
import { AuthShell, RolePicker, DemoRole } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [role, setRole] = useState<DemoRole>("public_user");
  const [err, setErr] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && user) router.replace("/chat");
  }, [mounted, user, router]);

  if (!mounted || user) return <div className="h-dvh bg-bg" />;

  const submit = () => {
    const e = email.trim();
    if (!e) return setErr("ইমেইল দাও");
    if (pass.length < 4) return setErr("পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দাও (ডেমো)");
    if (pass !== pass2) return setErr("দুইবার লেখা পাসওয়ার্ড মিলছে না");
    login({
      id: uid("u"),
      name: name.trim() || e.split("@")[0],
      email: e,
      role,
    });
    router.push("/chat");
  };

  return (
    <AuthShell kind="register">
      <div className="space-y-2.5">
        <input
          className="input-dark"
          placeholder="তোমার নাম"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
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
        />
        <input
          className="input-dark"
          placeholder="পাসওয়ার্ড আবার"
          type="password"
          value={pass2}
          onChange={(ev) => setPass2(ev.target.value)}
          onKeyDown={(ev) => ev.key === "Enter" && submit()}
        />
      </div>
      {err && <p className="mt-2 text-xs text-err">{err}</p>}
      <div className="mt-3">
        <RolePicker role={role} setRole={setRole} />
      </div>
      <button onClick={submit} className="btn-primary mt-4 w-full">
        অ্যাকাউন্ট খোলো →
      </button>
      <p className="mt-2.5 text-center text-[10.5px] text-muted">
        ডেমো — কোনো তথ্য সার্ভারে যায় না, ব্রাউজারেই থাকে
      </p>
    </AuthShell>
  );
}
