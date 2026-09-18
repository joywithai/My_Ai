"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type DemoRole = "admin" | "subscriber" | "public_user";

/** Shared shell for /login and /register pages */
export function AuthShell({
  kind,
  children,
}: {
  kind: "login" | "register";
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-indigo-400 text-xl font-black text-[#16101f] shadow-[0_0_30px_rgba(167,139,250,0.35)]">
          M
        </div>
        <h1 className="text-xl font-bold">
          My<span className="text-accent">Ai</span>
        </h1>
        <p className="mt-1 text-xs text-muted">
          {kind === "login"
            ? "তোমার AI avatar অপেক্ষা করছে…"
            : "নতুন অ্যাকাউন্ট খুলে শুরু করো"}
        </p>
      </div>

      <div className="glass p-5">{children}</div>

      <p className="mt-4 text-center text-xs text-muted">
        {kind === "login" ? (
          <>
            অ্যাকাউন্ট নেই?{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              সাইনআপ করো
            </Link>
          </>
        ) : (
          <>
            আগে থেকেই অ্যাকাউন্ট আছে?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              লগইন করো
            </Link>
          </>
        )}
      </p>
      <Link href="/" className="mx-auto mt-3 text-[11px] text-muted hover:text-txt">
        ← ফিরে যাও
      </Link>
    </main>
  );
}

export function RolePicker({
  role,
  setRole,
}: {
  role: DemoRole;
  setRole: (r: DemoRole) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] text-muted">
        ডেমো রোল (যে রোল দিয়ে ঢুকবে সেই ফিচারগুলো দেখা যাবে):
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {(["admin", "subscriber", "public_user"] as DemoRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "rounded-lg border py-2 text-[11.5px] font-semibold transition-all",
              role === r
                ? "border-accent/60 bg-accent-dim text-accent"
                : "border-line text-muted hover:text-txt"
            )}
          >
            {r === "admin" ? "Admin" : r === "subscriber" ? "Subscriber" : "Public"}
          </button>
        ))}
      </div>
    </div>
  );
}
