"use client";
import { useUi } from "@/lib/store/framing";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function ToastHost() {
  const toast = useUi((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  const icon =
    toast.kind === "ok" ? (
      <CheckCircle2 size={16} className="text-ok" />
    ) : toast.kind === "err" ? (
      <AlertCircle size={16} className="text-err" />
    ) : (
      <Info size={16} className="text-accent" />
    );

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="glass flex items-center gap-2.5 px-4 py-3 text-sm shadow-2xl">
        {icon}
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
