"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Shared shell for /login and /register pages */
export function AuthShell({
  kind,
  children,
}: {
  kind: "login" | "register";
  children: React.ReactNode;
}) {
  const t = useT();
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
          {kind === "login" ? "Your AI avatar is waiting…" : "Create a new account to get started"}
        </p>
      </div>

      <div className="glass p-5">{children}</div>

      <p className="mt-4 text-center text-xs text-muted">
        {kind === "login" ? (
          <>
            {t("noAccount")}{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              {t("signup")}
            </Link>
          </>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              {t("login")}
            </Link>
          </>
        )}
      </p>
      <Link href="/" className="mx-auto mt-3 text-[11px] text-muted hover:text-txt">
        ← {t("back")}
      </Link>
    </main>
  );
}
