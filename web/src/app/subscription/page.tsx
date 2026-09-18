"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Check, Loader2, PartyPopper, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { PLANS } from "@/lib/mock/data";
import { useUi } from "@/lib/store/framing";
import { Card, Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Plan } from "@/lib/types";

export default function SubscriptionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !user) router.replace("/");
  }, [mounted, user, router]);

  if (!mounted || !user) return <div className="h-dvh bg-bg" />;
  return <SubscriptionInner />;
}

function SubscriptionInner() {
  const router = useRouter();
  const user = useAuth((s) => s.user)!;
  const setRole = useAuth((s) => s.setRole);
  const showToast = useUi((s) => s.showToast);
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  const startCheckout = (plan: Plan) => {
    if (user.role === "admin") {
      showToast("অ্যাডমিন তো ইতিমধ্যে সব পাচ্ছে 😄", "info");
      return;
    }
    setCheckout(plan);
  };

  const pay = () => {
    setPaying(true);
    // DemoPaymentStrategy: instant success 😄
    setTimeout(() => {
      setPaying(false);
      setDone(true);
      setRole("subscriber");
    }, 1400);
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-4 pb-16">
      <div className="flex h-14 items-center gap-3">
        <button onClick={() => router.push("/chat")} className="btn-ghost !p-2">
          <ArrowLeft size={17} />
        </button>
        <h1 className="text-[15px] font-bold">সাবস্ক্রিপশন</h1>
        <span className="ml-auto rounded-full border border-accent/30 bg-accent-dim px-2.5 py-1 text-[10px] text-accent">
          ডেমো পেমেন্ট
        </span>
      </div>

      {user.role !== "public_user" && (
        <Card className="mx-auto mb-4 max-w-[640px] !border-ok/30">
          <div className="flex items-center gap-3">
            <PartyPopper className="text-ok" size={22} />
            <div>
              <p className="text-sm font-semibold text-ok">
                {user.role === "admin" ? "অ্যাডমিন — সবকিছু আনলকড" : "সাবস্ক্রিপশন অ্যাক্টিভ 🎉"}
              </p>
              <p className="text-xs text-muted">সব প্রিমিয়াম ফিচার ব্যবহার করছতে পারছো</p>
            </div>
          </div>
        </Card>
      )}

      <div className="mx-auto grid max-w-[640px] gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "glass relative p-5",
              plan.popular && "border-accent/50 shadow-[0_0_30px_rgba(167,139,250,0.12)]"
            )}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-[#16101f]">
                জনপ্রিয় ⭐
              </span>
            )}
            <h3 className="text-sm font-bold">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-accent">৳{plan.price}</span>
              <span className="text-xs text-muted">/ {plan.cycle === "monthly" ? "মাস" : "বছর"}</span>
            </div>
            <div className="my-4 h-px bg-line" />
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] text-txt/85">
                  <Check size={14} className="mt-0.5 shrink-0 text-ok" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout(plan)}
              disabled={user.role !== "public_user"}
              className={cn("mt-5 w-full", user.role !== "public_user" ? "btn-ghost" : "btn-primary")}
            >
              {user.role !== "public_user" ? "সক্রিয় ✓" : "সাবস্ক্রাইব করো"}
            </button>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-[640px] text-center text-[10.5px] leading-relaxed text-muted">
        ডেমো মোডে কোনো আসল টাকা কাটে না — চেকআউটে ক্লিক করলেই সাবস্ক্রিপশন অ্যাক্টিভ হয়।
        পরে Stripe / SSLCommerz বসবে (README প্ল্যান অনুযায়ী)।
      </p>

      {/* checkout modal */}
      {checkout && !done && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass rise-in w-full max-w-[400px] p-6">
            <div className="flex items-center gap-2 text-xs text-warn">
              <ShieldAlert size={14} />
              ডেমো মোড — কোনো আসল পেমেন্ট হবে না
            </div>
            <h3 className="mt-3 text-base font-bold">{checkout.name}</h3>
            <p className="mt-1 text-2xl font-black text-accent">
              ৳{checkout.price}
              <span className="text-xs font-normal text-muted">
                {" "}
                / {checkout.cycle === "monthly" ? "মাস" : "বছর"}
              </span>
            </p>
            <div className="my-4 h-px bg-line" />
            <button onClick={pay} disabled={paying} className="btn-primary flex w-full items-center justify-center gap-2">
              {paying ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> প্রসেস হচ্ছে…
                </>
              ) : (
                <>কেনাকাটা সম্পন্ন করো</>
              )}
            </button>
            <button onClick={() => setCheckout(null)} className="btn-ghost mt-2 w-full text-xs">
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* success modal */}
      {done && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass rise-in w-full max-w-[400px] p-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok/15">
              <Crown size={30} className="text-ok" />
            </div>
            <h3 className="text-lg font-bold">স্বাগতম, সাবস্ক্রাইবার! 🎉</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              সব প্রিমিয়াম ফিচার আনলক হয়ে গেছে — সব expression, animation, ভয়েস কন্ট্রোল, কাস্টম API key।
            </p>
            <button onClick={() => router.push("/chat")} className="btn-primary mt-5 w-full">
              চ্যাটে ফিরে যাও →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
