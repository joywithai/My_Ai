import { NextRequest, NextResponse } from "next/server";
import { getDb, save, userFromRequest, defaultSettings, DbCustomAi } from "@/lib/server/db";

const ALLOWED = new Set([
  "language", "uiLanguage", "voiceName", "voiceSpeed", "voicePitch", "defaultExpression",
  "enabledAnimations", "blinkEnabled", "thinkingPoseEnabled", "showSubtitles",
  "autoPlayAudio", "demoVoiceOn", "avatarModelId",
]);

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  return NextResponse.json({
    settings: db.userSettings[user.id] ?? defaultSettings("bn", "en"),
    customAi: db.customAi[user.id]
      ? { ...db.customAi[user.id]!, keyEncrypted: undefined }
      : null,
  });
}

export async function PUT(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const cur = db.userSettings[user.id] ?? defaultSettings("bn", "en");
  const patch = await req.json();
  for (const [k, v] of Object.entries(patch)) {
    if (ALLOWED.has(k)) (cur as any)[k] = v;
  }
  db.userSettings[user.id] = cur;

  // custom AI config save/remove
  if (patch.customAi === null) {
    db.customAi[user.id] = null;
  } else if (patch.customAi && typeof patch.customAi === "object" && patch.customAi.apiKey) {
    const flags = db.flags[user.role] ?? {};
    if (!flags.canUseCustomApiKey) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const cfg: DbCustomAi = {
      provider: patch.customAi.provider ?? "openrouter",
      keyEncrypted: Buffer.from(String(patch.customAi.apiKey)).toString("base64"), // demo; real backend uses DataProtection
      maskedKey: String(patch.customAi.apiKey).slice(0, 5) + "…" + String(patch.customAi.apiKey).slice(-4),
      model: patch.customAi.model ?? "gemini-2.5-flash",
      baseUrl: patch.customAi.baseUrl ?? "https://openrouter.ai/api/v1/",
      temperature: patch.customAi.temperature ?? 0.7,
      maxOutputTokens: patch.customAi.maxOutputTokens ?? 2048,
      isValid: true,
      testedAt: Date.now(),
    };
    db.customAi[user.id] = cfg;
  }
  save();
  return NextResponse.json({
    settings: db.userSettings[user.id],
    customAi: db.customAi[user.id] ? { ...db.customAi[user.id]!, keyEncrypted: undefined } : null,
  });
}
