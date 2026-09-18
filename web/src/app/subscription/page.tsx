"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Check, Loader2, PartyPopper } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { api } from "@/lib/api";
import { useUi } from "@/lib/store/framing";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface PlanView {
  id: string;
  name: string;
  price: number;
  currency: string;
  cycle: "monthly" | "yearly";
  features: string[];
  popular?: boolean;
  active: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !user) router.replace("/");
  }, [mounted, user, router]);

  if (!mounted || !user) return <div className="h-dvh bg-bg" />;
  return <Inner />;
}

function Inner() {
  const router = useRouter();
  const user = useAuth((s) => s.user)!;
  const refresh = useAuth((s) => s.refresh);
  const showToast = useUi((s) => s.showToast);
  const [plans, setPlans] = useState<PlanView[] | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((j) => setPlans(j.plans ?? []))
      .catch(() => setPlans([]));
  }, []);

  const checkout = async (plan: PlanView) => {
    if (user.role === "admin") {
      showToast("Admin already has everything 😄", "info");
      return;
    }
    setPaying(plan.id);
    try {
      await api("/payments/checkout", { method: "POST", json: { planId: plan.id } });
      await refresh();
      setDone(true);
    } catch {
      showToast("Payment failed — try again", "err");
    } finally {
      setPaying(null);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-4 pb-16">
      <div className="flex h-14 items-center gap-3">
        <button onClick={() => router.push("/chat")} className="btn-ghost !p-2">
          <ArrowLeft size={17} />
        </button>
        <h1 className="text-[15px] font-bold">Subscription</h1>
      </div>

      {done ? (
        <div className="glass mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <PartyPopper size={34} className="text-accent" />
          <p className="text-sm font-semibold">You are Pro now! 🎉</p>
          <p className="text-xs text-muted">All premium features unlocked — enjoy.</p>
          <button className="btn-primary mt-2 !px-6 text-xs" onClick={() => router.push("/chat")}>
            Back to chat
          </button>
        </div>
      ) : user.role !== "public_user" ? (
        <div className="glass mt-8 flex flex-col items-center gap-2.5 p-10 text-center">
          <Crown size={30} className="text-accent" />
          <p className="text-sm font-semibold">All premium features unlocked 🎉</p>
          <button className="btn-ghost mt-2 text-xs" onClick={() => router.push("/chat")}>
            Back to chat
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(plans ?? []).filter((p) => p.active).map((p) => (
            <div
              key={p.id}
              className={cn(
                "glass relative flex flex-col p-5",
                p.popular && "border-accent/50 shadow-[0_0_30px_rgba(167,139,250,0.12)]"
              )}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-[#16101f]">
                  popular
                </span>
              )}
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-bold">{p.name}</p>
                {p.price === 0 && <Badge>free</Badge>}
              </div>
              <p className="mb-3">
                <span className="text-2xl font-black">{p.price === 0 ? "৳0" : `৳${p.price}`}</span>
                <span className="text-[11px] text-muted">/{p.cycle === "yearly" ? "yr" : "mo"}</span>
              </p>
              <ul className="mb-5 flex-1 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11.5px] text-txt/80">
                    <Check size={13} className="mt-0.5 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={p.price === 0 || paying !== null}
                onClick={() => checkout(p)}
                className={cn("w-full text-xs", p.popular ? "btn-primary" : "btn-ghost")}
              >
                {paying === p.id ? <Loader2 size={13} className="mx-auto animate-spin" /> : p.price === 0 ? "Current plan" : "Checkout"}
              </button>
            </div>
          ))}
          {!plans && <p className="py-10 text-center text-xs text-muted sm:col-span-3">…</p>}
        </div>
      )}
    </main>
  );
}
