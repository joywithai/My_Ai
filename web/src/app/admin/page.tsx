"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, ShieldCheck, Users, ToggleLeft, Smile, PersonStanding, Package,
  Settings2, ScrollText, RefreshCw, Crown, Ban, Trash2, Check, Play,
} from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { api } from "@/lib/api";
import { Badge, Toggle, Slider, Select } from "@/components/ui/primitives";
import { useUi } from "@/lib/store/framing";
import { cn, timeAgo } from "@/lib/utils";

type Tab = "users" | "flags" | "expressions" | "animations" | "avatars" | "plans" | "system" | "audit";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "users", label: "Users", icon: <Users size={14} /> },
  { id: "flags", label: "Flags", icon: <ToggleLeft size={14} /> },
  { id: "expressions", label: "Expressions", icon: <Smile size={14} /> },
  { id: "animations", label: "Animations", icon: <Play size={14} /> },
  { id: "avatars", label: "Avatars", icon: <PersonStanding size={14} /> },
  { id: "plans", label: "Plans", icon: <Package size={14} /> },
  { id: "system", label: "System", icon: <Settings2 size={14} /> },
  { id: "audit", label: "Audit", icon: <ScrollText size={14} /> },
];

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useAuth((s) => s.user);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && (!user || user.role !== "admin")) router.replace("/chat");
  }, [mounted, user, router]);

  const [tab, setTab] = useState<Tab>("users");

  if (!mounted || !user || user.role !== "admin") return <div className="h-dvh bg-bg" />;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[1000px] px-4 pb-16">
      <div className="flex h-14 items-center gap-3">
        <button onClick={() => router.push("/chat")} className="btn-ghost !p-2">
          <ArrowLeft size={17} />
        </button>
        <h1 className="flex items-center gap-2 text-[15px] font-bold">
          <ShieldCheck size={16} className="text-err" /> Admin
        </h1>
      </div>

      <div className="glass mb-4 flex flex-wrap gap-1 rounded-xl p-1">
        {TABS.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              tab === x.id ? "bg-accent text-[#16101f]" : "text-muted hover:text-txt"
            )}
          >
            {x.icon}
            {x.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "flags" && <FlagsTab />}
      {tab === "expressions" && <ListTab kind="expressions" />}
      {tab === "animations" && <ListTab kind="animations" />}
      {tab === "avatars" && <AvatarsTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "system" && <SystemTab />}
      {tab === "audit" && <AuditTab />}
    </main>
  );
}

/* ───────── users ───────── */

interface AdminUser {
  id: string; email: string; name: string; role: string; status: string;
  createdAt: number; lastLoginAt: number | null; subscribedUntil: number | null;
  messagesToday: number; dailyLimit: number; hasCustomKey: boolean;
}

function UsersTab() {
  const showToast = useUi((s) => s.showToast);
  const me = useAuth((s) => s.user)!;
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  const load = useCallback(() => {
    api<{ users: AdminUser[] }>("/admin/users").then((r) => setUsers(r.users)).catch(() => setUsers([]));
  }, []);
  useEffect(load, [load]);

  const patchUser = async (id: string, patch: any) => {
    await api(`/admin/users/${id}`, { method: "PATCH", json: patch });
    showToast("Updated ✅");
    load();
  };

  if (!users) return <Loading />;
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="glass flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-sm font-bold text-accent">
            {u.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-[150px] flex-1">
            <p className="text-[13px] font-semibold">
              {u.name} {u.id === me.id && <span className="text-[10px] text-muted">(you)</span>}
            </p>
            <p className="text-[11px] text-muted">{u.email}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted">today</p>
            <p className="text-[11.5px] font-mono">{u.messagesToday}/{u.dailyLimit < 0 ? "∞" : u.dailyLimit}</p>
          </div>

          <Select
            className="!w-[130px]"
            value={u.role}
            onChange={(role) => patchUser(u.id, { role })}
            options={[
              { value: "admin", label: "Admin" },
              { value: "subscriber", label: "Subscriber" },
              { value: "public_user", label: "Public" },
            ]}
          />

          {u.hasCustomKey && <Badge tone="purple">API key</Badge>}
          {u.subscribedUntil && <Badge tone="green">pro → {new Date(u.subscribedUntil).toLocaleDateString()}</Badge>}

          <div className="ml-auto flex gap-1.5">
            {u.id !== me.id && (
              <>
                <button
                  className={cn("btn-ghost !px-2.5 !py-1.5 text-[11px]", u.status === "banned" && "!text-ok")}
                  onClick={() => patchUser(u.id, { status: u.status === "banned" ? "active" : "banned" })}
                  title={u.status === "banned" ? "Unban" : "Ban"}
                >
                  <Ban size={13} />
                </button>
                <button
                  className="btn-ghost !px-2.5 !py-1.5 text-[11px] !text-err/90"
                  onClick={async () => {
                    await api(`/admin/users/${u.id}`, { method: "DELETE" }).catch(() => {});
                    showToast("User deleted");
                    load();
                  }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      {users.length === 0 && <Empty label="No users" />}
    </div>
  );
}

/* ───────── flags ───────── */

const FLAG_DEFS: { key: string; label: string; type: "bool" | "number" }[] = [
  { key: "canUseCustomApiKey", label: "Custom API key", type: "bool" },
  { key: "canAccessAllExpressions", label: "All expressions", type: "bool" },
  { key: "canAccessAllAnimations", label: "All animations", type: "bool" },
  { key: "canSelectAvatarModel", label: "Avatar selection", type: "bool" },
  { key: "canCustomizeVoice", label: "Voice speed/pitch", type: "bool" },
  { key: "canAccessChatHistory", label: "Chat history", type: "bool" },
  { key: "maxConversationHistory", label: "History limit (-1 ∞)", type: "number" },
  { key: "maxMessagesPerDay", label: "Messages / day (-1 ∞)", type: "number" },
];

function FlagsTab() {
  const showToast = useUi((s) => s.showToast);
  const [flags, setFlags] = useState<Record<string, Record<string, any>> | null>(null);

  const load = useCallback(() => {
    api<{ flags: any }>("/admin/flags").then((r) => setFlags(r.flags)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const change = async (role: string, key: string, value: any) => {
    setFlags((f) => (f ? { ...f, [role]: { ...f[role], [key]: value } } : f));
    await api("/admin/flags", { method: "PUT", json: { role, patch: { [key]: value } } });
    showToast("Applied instantly ✅");
  };

  if (!flags) return <Loading />;
  const roles: Array<keyof typeof flags> = ["admin", "subscriber", "public_user"];
  return (
    <div className="glass overflow-x-auto p-4">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wide text-muted">
            <th className="pb-2">Feature</th>
            {roles.map((r) => (
              <th key={r} className="pb-2 text-center capitalize">{r.replace("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FLAG_DEFS.map((def) => (
            <tr key={def.key} className="border-t border-line/50">
              <td className="py-2.5 text-[12px] text-txt/85">{def.label}</td>
              {roles.map((r) => (
                <td key={r} className="py-2.5">
                  <div className="flex justify-center">
                    {def.type === "bool" ? (
                      <Toggle checked={!!flags[r]?.[def.key]} onChange={(v) => change(r, def.key, v)} />
                    ) : (
                      <input
                        type="number"
                        className="input-dark !w-[90px] !py-1.5 text-center text-xs"
                        value={flags[r]?.[def.key] ?? 0}
                        onChange={(e) => change(r, def.key, parseInt(e.target.value) || 0)}
                      />
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────── expressions / animations (list editors) ───────── */

function ListTab({ kind }: { kind: "expressions" | "animations" }) {
  const showToast = useUi((s) => s.showToast);
  const [items, setItems] = useState<any[] | null>(null);

  const load = useCallback(() => {
    api<{ [k: string]: any[] }>(`/admin/${kind}`).then((r) => setItems(r[kind] ?? [])).catch(() => setItems([]));
  }, [kind]);
  useEffect(load, [load]);

  const put = async (id: string, patch: any) => {
    await api(`/admin/${kind}`, { method: "PUT", json: { id, patch } });
    showToast("Updated ✅");
    load();
  };

  if (!items) return <Loading />;
  return (
    <div className="space-y-1.5">
      {items.map((it) => (
        <div key={it.id} className="glass flex items-center gap-4 p-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">{it.name}</p>
            {it.label && <p className="text-[10.5px] text-muted">{it.label}</p>}
          </div>
          <Select
            className="!w-[150px]"
            value={it.minRole}
            onChange={(minRole) => put(it.id, { minRole })}
            options={[
              { value: "public_user", label: "Public" },
              { value: "subscriber", label: "Subscriber" },
            ]}
          />
          <Toggle checked={it.active} onChange={(v) => put(it.id, { active: v })} />
        </div>
      ))}
      {items.length === 0 && <Empty label="Empty" />}
    </div>
  );
}

/* ───────── avatars ───────── */

function AvatarsTab() {
  const showToast = useUi((s) => s.showToast);
  const [models, setModels] = useState<any[] | null>(null);

  const load = useCallback(() => {
    api<{ models: any[] }>("/admin/avatars").then((r) => setModels(r.models)).catch(() => setModels([]));
  }, []);
  useEffect(load, [load]);

  const put = async (id: string, patch: any) => {
    await api("/admin/avatars", { method: "PUT", json: { id, patch } });
    showToast("Updated ✅");
    load();
  };

  if (!models) return <Loading />;
  return (
    <div className="space-y-1.5">
      {models.map((m) => (
        <div key={m.id} className="glass flex flex-wrap items-center gap-4 p-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">
              {m.name} {m.isDefault && <Badge tone="green">default</Badge>}
            </p>
            <p className="font-mono text-[10.5px] text-muted">{m.file} · {m.gender}</p>
          </div>
          <Select
            className="!w-[150px]"
            value={m.minRole}
            onChange={(minRole) => put(m.id, { minRole })}
            options={[
              { value: "public_user", label: "Public" },
              { value: "subscriber", label: "Subscriber" },
            ]}
          />
          {!m.isDefault && (
            <button className="btn-ghost !px-2.5 !py-1.5 text-[11px]" onClick={() => put(m.id, { isDefault: true })} title="Make default">
              <Crown size={13} />
            </button>
          )}
          <Toggle checked={m.active} onChange={(v) => put(m.id, { active: v })} />
        </div>
      ))}
      <p className="px-1 pt-1 text-[10.5px] text-muted">
        Upload male model file to web/public/models/avatar-male.vrm to enable the male avatar.
      </p>
    </div>
  );
}

/* ───────── plans ───────── */

function PlansTab() {
  const showToast = useUi((s) => s.showToast);
  const [plans, setPlans] = useState<any[] | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const load = useCallback(() => {
    api<{ plans: any[]; payments: any[] }>("/admin/plans")
      .then((r) => {
        setPlans(r.plans);
        setPayments(r.payments ?? []);
      })
      .catch(() => setPlans([]));
  }, []);
  useEffect(load, [load]);

  const patch = async (id: string, p: any) => {
    await api(`/admin/plans/${id}`, { method: "PATCH", json: p });
    showToast("Saved ✅");
    load();
  };

  if (!plans) return <Loading />;
  return (
    <>
      <div className="space-y-1.5">
        {plans.map((pl) => (
          <div key={pl.id} className="glass flex flex-wrap items-center gap-4 p-3.5">
            <div className="min-w-[140px] flex-1">
              <p className="text-[13px] font-semibold">{pl.name}</p>
              <p className="text-[10.5px] text-muted">{pl.cycle}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                className="input-dark !w-[100px] !py-1.5 text-center text-xs"
                defaultValue={pl.price}
                onBlur={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v !== pl.price) patch(pl.id, { price: v });
                }}
              />
              <span className="text-[11px] text-muted">{pl.currency}</span>
            </div>
            <Toggle checked={pl.active} onChange={(v) => patch(pl.id, { active: v })} />
          </div>
        ))}
      </div>
      {payments.length > 0 && (
        <div className="glass mt-4 p-4">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">recent payments</p>
          {payments.slice(0, 8).map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-line/40 py-2 text-[11.5px] last:border-0">
              <span className="font-mono text-muted">{p.referenceId}</span>
              <span>{p.amount} {p.currency}</span>
              <Badge tone={p.status === "succeeded" ? "green" : "default"}>{p.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ───────── system ───────── */

function SystemTab() {
  const showToast = useUi((s) => s.showToast);
  const [sys, setSys] = useState<any>(null);

  useEffect(() => {
    api<{ systemSettings: any }>("/admin/settings")
      .then((r) => setSys(r.systemSettings))
      .catch(() => {});
  }, []);

  const change = async (patch: any) => {
    setSys((s: any) => ({ ...s, ...patch }));
    await api("/admin/settings", { method: "PUT", json: patch });
    showToast("Saved ✅");
  };

  if (!sys) return <Loading />;
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between border-b border-line/50 py-3.5">
        <p className="text-[13px] font-medium">Registration open</p>
        <Toggle checked={sys.registrationOpen} onChange={(v) => change({ registrationOpen: v })} />
      </div>
      <div className="flex items-center justify-between border-b border-line/50 py-3.5">
        <p className="text-[13px] font-medium">Default UI language</p>
        <Select
          className="!w-[120px]"
          value={sys.defaultUiLanguage}
          onChange={(v) => change({ defaultUiLanguage: v })}
          options={[{ value: "en", label: "English" }, { value: "bn", label: "বাংলা" }]}
        />
      </div>
      <div className="flex items-center justify-between border-b border-line/50 py-3.5">
        <p className="text-[13px] font-medium">Default input language</p>
        <Select
          className="!w-[120px]"
          value={sys.defaultInputLanguage}
          onChange={(v) => change({ defaultInputLanguage: v })}
          options={[{ value: "bn", label: "বাংলা" }, { value: "en", label: "English" }]}
        />
      </div>
      <div className="flex items-center justify-between py-3.5">
        <p className="text-[13px] font-medium">Default AI model (system)</p>
        <input
          className="input-dark !w-[240px] font-mono text-xs"
          defaultValue={sys.aiModel}
          onBlur={(e) => e.target.value !== sys.aiModel && change({ aiModel: e.target.value })}
        />
      </div>
    </div>
  );
}

/* ───────── audit ───────── */

function AuditTab() {
  const [logs, setLogs] = useState<any[] | null>(null);
  useEffect(() => {
    api<{ audit: any[] }>("/admin/audit").then((r) => setLogs(r.audit)).catch(() => setLogs([]));
  }, []);
  if (!logs) return <Loading />;
  return (
    <div className="glass p-4">
      {logs.map((l) => (
        <div key={l.id} className="flex items-center gap-3 border-b border-line/40 py-2.5 text-[11.5px] last:border-0">
          <Badge tone={l.action.includes("delete") || l.action.includes("ban") ? "red" : "default"}>{l.action}</Badge>
          <span className="text-muted">{l.resource}</span>
          <span className="truncate text-muted">{l.detail}</span>
          <span className="ml-auto shrink-0 text-muted">{timeAgo(l.createdAt)}</span>
        </div>
      ))}
      {logs.length === 0 && <Empty label="No activity yet" />}
    </div>
  );
}

/* ───────── small bits ───────── */

function Loading() {
  return (
    <div className="flex justify-center py-16">
      <RefreshCw size={18} className="animate-spin text-accent" />
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-line py-10 text-center text-xs text-muted">{label}</p>;
}
