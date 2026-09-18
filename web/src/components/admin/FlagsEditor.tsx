"use client";
import { Card, Badge, Toggle } from "@/components/ui/primitives";
import { useSettings } from "@/lib/store/settings";
import { useUi } from "@/lib/store/framing";
import { FeatureFlags, Role, ROLE_LABEL } from "@/lib/types";

const BOOL_FLAGS: { key: keyof FeatureFlags; label: string }[] = [
  { key: "canUseCustomApiKey", label: "কাস্টম AI API key" },
  { key: "canAccessAllExpressions", label: "সব expression" },
  { key: "canAccessAllAnimations", label: "সব animation" },
  { key: "canSelectAvatarModel", label: "Avatar model সিলেক্ট" },
  { key: "canCustomizeVoice", label: "ভয়েস speed/pitch" },
  { key: "canAccessChatHistory", label: "চ্যাট হিস্টোরি" },
];

const ROLES: Role[] = ["admin", "subscriber", "public_user"];

export default function FlagsEditor() {
  const flags = useSettings((s) => s.flags);
  const setFlag = useSettings((s) => s.setFlag);
  const resetFlags = useSettings((s) => s.resetFlags);
  const showToast = useUi((s) => s.showToast);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">রোল ফিচার ফ্ল্যাগস</h2>
          <p className="mt-0.5 text-[11px] text-muted">টগল চাপলেই সাথে সাথে সব ইউজারে প্রযোজ্য হয়</p>
        </div>
        <button
          className="btn-ghost !py-2 text-[11px]"
          onClick={() => {
            resetFlags();
            showToast("ডিফল্ট ফ্ল্যাগসে ফিরে গেছে", "info");
          }}
        >
          রিসেট
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-line">
              <th className="pb-2.5 text-left text-[11px] font-medium text-muted">ফিচার</th>
              {ROLES.map((r) => (
                <th key={r} className="pb-2.5 text-center">
                  <Badge tone={r === "admin" ? "red" : r === "subscriber" ? "purple" : "default"}>
                    {ROLE_LABEL[r]}
                  </Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOOL_FLAGS.map(({ key, label }) => (
              <tr key={key} className="border-b border-line/50 last:border-0">
                <td className="py-2.5 text-[12.5px] text-txt/85">{label}</td>
                {ROLES.map((r) => (
                  <td key={r} className="py-2.5 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={flags[r][key] as boolean}
                        onChange={(v) => {
                          setFlag(r, key, v);
                          showToast(`${ROLE_LABEL[r]} → ${label}: ${v ? "ON" : "OFF"}`);
                        }}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-line/50">
              <td className="py-2.5 text-[12.5px] text-txt/85">দৈনিক মেসেজ লিমিট</td>
              {ROLES.map((r) => (
                <td key={r} className="py-2.5 text-center">
                  <input
                    type="number"
                    value={flags[r].maxMessagesPerDay}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || "0", 10);
                      setFlag(r, "maxMessagesPerDay", v);
                    }}
                    className="input-dark mx-auto !w-[80px] !py-1.5 text-center text-xs"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2.5 text-[12.5px] text-txt/85">হিস্টোরি লিমিট (-1 = আনলিমিটেড)</td>
              {ROLES.map((r) => (
                <td key={r} className="py-2.5 text-center">
                  <input
                    type="number"
                    value={flags[r].maxConversationHistory}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || "0", 10);
                      setFlag(r, "maxConversationHistory", v);
                    }}
                    className="input-dark mx-auto !w-[80px] !py-1.5 text-center text-xs"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10.5px] text-muted">
        ডেমোতে ব্রাউজারে সেভ হয় — ব্যাকএন্ডে <code className="font-mono">role_feature_flags</code> টেবিল + Redis cache invalidation হবে
      </p>
    </Card>
  );
}
