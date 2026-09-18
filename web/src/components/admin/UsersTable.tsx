"use client";
import { useState } from "react";
import { DEMO_USERS } from "@/lib/mock/data";
import { Card, Badge, Select } from "@/components/ui/primitives";
import { Role, ROLE_LABEL, DemoUser } from "@/lib/types";
import { useUi } from "@/lib/store/framing";
import { cn } from "@/lib/utils";

export default function UsersTable() {
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS);
  const showToast = useUi((s) => s.showToast);

  const setRole = (id: string, role: string) => {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, role: role as Role } : u)));
    showToast(`রোল বদলেছে → ${ROLE_LABEL[role as Role]}`);
  };
  const toggleBan = (id: string) => {
    setUsers((us) => {
      const u = us.find((x) => x.id === id);
      showToast(u?.banned ? "ইউজার unbanned ✅" : "ইউজার banned 🚫", u?.banned ? "ok" : "err");
      return us.map((x) => (x.id === id ? { ...x, banned: !x.banned } : x));
    });
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">ইউজার ম্যানেজমেন্ট</h2>
        <Badge>{users.length} জন</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2.5 pr-3 font-medium">নাম</th>
              <th className="pb-2.5 pr-3 font-medium">রোল</th>
              <th className="pb-2.5 pr-3 font-medium">স্ট্যাটাস</th>
              <th className="pb-2.5 font-medium">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line/50 text-[12.5px] last:border-0">
                <td className="py-3 pr-3">
                  <p className="font-medium text-txt/90">{u.name}</p>
                  <p className="text-[10.5px] text-muted">{u.email} · {u.lastActive}</p>
                </td>
                <td className="py-3 pr-3">
                  <Select
                    className="!w-[130px] !py-1.5 text-xs"
                    value={u.role}
                    onChange={(v) => setRole(u.id, v)}
                    options={[
                      { value: "public_user", label: ROLE_LABEL.public_user },
                      { value: "subscriber", label: ROLE_LABEL.subscriber },
                      { value: "admin", label: ROLE_LABEL.admin },
                    ]}
                  />
                </td>
                <td className="py-3 pr-3">
                  <Badge tone={u.banned ? "red" : "green"}>{u.banned ? "Banned" : "Active"}</Badge>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => toggleBan(u.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition",
                      u.banned
                        ? "border-ok/40 text-ok hover:bg-ok/10"
                        : "border-err/40 text-err hover:bg-err/10"
                    )}
                  >
                    {u.banned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10.5px] text-muted">
        ডেমো ডেটা — ব্যাকএন্ড যুক্ত হলে <code className="font-mono">GET /api/v1/admin/users</code> থেকে আসবে
      </p>
    </Card>
  );
}
