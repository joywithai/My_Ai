/**
 * .NET contract stub — mirrors MyAi.Api controllers 1:1 (routes + JSON shapes).
 * Purpose: E2E-test the frontend's backend wiring WITHOUT dotnet/PostgreSQL
 * (e.g. in CI or this sandbox). NOT part of the app; the real backend is
 * `backend/` (docker compose up / Visual Studio F5).
 *
 * Usage: node tuning/dotnetStub.js   → http://localhost:5000
 * Verbose: prints every endpoint hit (evidence for E2E coverage).
 */
const http = require("http");
const crypto = require("crypto");

const hits = new Set();
const tokenUser = new Map(); // raw Authorization header → user (stateful like a real auth server)
const H = (req, res) => {
  // CORS like the .NET Cors:"frontend" policy
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  res.json = (code, body) => { hits.add(`${req.method} ${req.url.split("?")[0]}`); res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };

  const url = req.url.split("?")[0];
  const seg = url.split("/").filter(Boolean); // ["api", ...]
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const j = body ? JSON.parse(body) : {};
    const rawTok = (req.headers.authorization || "").replace(/^Bearer /, "");
    const remembered = tokenUser.get(rawTok);
    const email = j.email ?? remembered?.email ?? "sub@demo.com";
    const role = email.startsWith("admin") ? "admin" : email.startsWith("public") ? "public_user" : "subscriber";
    const user = email.startsWith("admin")
      ? { id: "a1000000-0000-0000-0000-000000000001", name: "Admin", email, role, status: "active" }
      : email.startsWith("public")
        ? { id: "c9000000-0000-0000-0000-000000000009", name: "Pub", email, role, status: "active" }
        : { id: "b2000000-0000-0000-0000-000000000002", name: "Sub", email, role, status: "active" };
    if (url.startsWith("/api/auth/")) tokenUser.set("stub.access.token", user);

    const settings = {
      language: "bn", uiLanguage: "en", voiceName: "bn-BD-NabanitaNeural", voiceSpeed: 1,
      voicePitch: 0, defaultExpression: "natural", enabledAnimations: ["idle"], blinkEnabled: true,
      thinkingPoseEnabled: true, showSubtitles: true, autoPlayAudio: true, demoVoiceOn: false, avatarModelId: null,
    };
    const auth = () => res.json(200, {
      token: "stub.access.token", refreshToken: "stub.refresh.token",
      user, settings,
    });

    // ── auth ──
    if (url === "/api/auth/login" || url === "/api/auth/register") return auth();
    if (url === "/api/auth/refresh") return auth();
    if (url === "/api/auth/logout") { hits.add("POST /api/auth/logout"); res.writeHead(204); return res.end(); }
    if (url === "/api/auth/me" && req.method === "GET") return res.json(200, { user, settings: settings, subscription: null });
    if (url === "/api/auth/me" && req.method === "PATCH") return res.json(200, { user: { ...user, name: j.name } });

    // ── chat + tts ──
    if (url === "/api/chat") {
      return res.json(200, {
        conversationId: "c3000000-0000-0000-0000-000000000003",
        segments: [
          { expression: "happy", text: "Hello there!" },
          { expression: "neutral", text: "How can I help you today?" },
        ],
        usage: { count: 3, limit: 500 },
      });
    }
    if (url === "/api/tts") {
      // 1.2s of silence as a valid WAV + boundaries at 0 / 0.5 / 1.0 s
      const sr = 8000, n = sr * 1.2;
      const buf = Buffer.alloc(44 + n * 2);
      buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8);
      buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
      buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
      buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
      return res.json(200, {
        audioBase64: buf.toString("base64"),
        contentType: "audio/wav",
        boundaries: [
          { charIndex: 0, length: 5, text: "Hello", offset: 0 },
          { charIndex: 6, length: 5, text: "there", offset: 50000000 },
          { charIndex: 12, length: 3, text: "How", offset: 100000000 },
        ],
      });
    }

    // ── conversations ──
    if (url === "/api/conversations" && req.method === "GET")
      return res.json(200, { conversations: [{ id: "c3000000-0000-0000-0000-000000000003", title: "Hello", updatedAt: "2026-01-01T00:00:00Z", messageCount: 2 }] });
    if (seg[1] === "conversations" && seg[2] && req.method === "GET")
      return res.json(200, {
        conversation: { id: seg[2], title: "Hello", updatedAt: "2026-01-01T00:00:00Z" },
        messages: [
          { role: "user", content: "hi", segments: [], createdAt: "2026-01-01T00:00:00Z" },
          { role: "assistant", content: "Hello there! How can I help you today?", segments: [{ expression: "happy", text: "Hello there!" }, { expression: "neutral", text: "How can I help you today?" }], createdAt: "2026-01-01T00:00:01Z" },
        ],
      });
    if (seg[1] === "conversations" && seg[2] && req.method === "DELETE") return res.json(200, { ok: true });

    // ── catalog ──
    if (url === "/api/avatars")
      return res.json(200, { models: [
        { id: "d4000000-0000-0000-0000-000000000004", name: "Aanya", gender: "female", file: "/models/avatar.vrm", isDefault: true },
        { id: "d4000000-0000-0000-0000-000000000005", name: "Arif", gender: "male", file: "/models/avatar-male.vrm", isDefault: false },
      ] });
    if (url === "/api/plans")
      return res.json(200, { plans: [
        { id: "e5000000-0000-0000-0000-000000000001", name: "Free", price: 0, currency: "BDT", cycle: "monthly", features: ["50 messages/day"], popular: false, active: true },
        { id: "e5000000-0000-0000-0000-000000000002", name: "Premium", price: 499, currency: "BDT", cycle: "monthly", features: ["500 messages/day", "Custom AI key"], popular: true, active: true },
      ] });

    // ── payments ──
    if (url === "/api/payments/checkout")
      return res.json(200, { ok: true, payment: { id: "f6000000-0000-0000-0000-000000000006", amount: 499, status: "succeeded" }, role: "subscriber" });

    // ── settings ──
    if (url === "/api/settings" && req.method === "GET")
      return res.json(200, { settings, customAi: { provider: "openrouter", maskedKey: "sk-0…abcd", model: "gemini-2.5-flash", baseUrl: "https://openrouter.ai/api/v1/", temperature: 0.7, maxOutputTokens: 2048, isValid: true } });
    if (url === "/api/settings" && req.method === "PUT")
      return res.json(200, { settings: { ...settings, ...Object.fromEntries(Object.entries(j).filter(([k]) => k !== "customAi")) }, customAi: j.customAi === null ? null : { provider: "openrouter", maskedKey: "sk-0…abcd", model: "gemini-2.5-flash", baseUrl: "https://openrouter.ai/api/v1/", temperature: 0.7, maxOutputTokens: 2048, isValid: true } });

    // ── framing ──
    if (url === "/api/framing") return res.json(200, { framing: { targetY: 1.43, camY: 1.46, camZ: 1.4, fov: 33, locked: false } });

    // ── admin ──
    if (url === "/api/admin/users") return res.json(200, { users: [{ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, createdAt: "2026-01-01T00:00:00Z", lastLoginAt: "2026-01-01T00:00:00Z", subscribedUntil: null, messagesToday: 3, dailyLimit: 500, hasCustomKey: true }] });
    if (seg[1] === "admin" && seg[2] === "users" && seg[3] && req.method === "PATCH") return res.json(200, { ok: true });
    if (seg[1] === "admin" && seg[2] === "users" && seg[3] && req.method === "DELETE") { res.writeHead(204); return res.end(); }
    if (url === "/api/admin/flags") {
      const flags = {
        public_user: { canUseCustomApiKey: false, canAccessAllExpressions: false, canAccessAllAnimations: false, canSelectAvatarModel: false, canCustomizeVoice: false, canAccessChatHistory: true, maxConversationHistory: 10, maxMessagesPerDay: 50 },
        subscriber: { canUseCustomApiKey: true, canAccessAllExpressions: true, canAccessAllAnimations: true, canSelectAvatarModel: true, canCustomizeVoice: true, canAccessChatHistory: true, maxConversationHistory: 100, maxMessagesPerDay: 500 },
        admin: { canUseCustomApiKey: true, canAccessAllExpressions: true, canAccessAllAnimations: true, canSelectAvatarModel: true, canCustomizeVoice: true, canAccessChatHistory: true, maxConversationHistory: -1, maxMessagesPerDay: -1 },
      };
      return res.json(200, { flags });
    }
    if (url === "/api/admin/expressions") return res.json(200, { expressions: [{ id: "01000000-0000-0000-0000-000000000001", name: "natural", label: "Natural", minRole: "public_user", active: true }] });
    if (url === "/api/admin/animations") return res.json(200, { animations: [{ id: "02000000-0000-0000-0000-000000000002", name: "idle", label: "Idle", minRole: "public_user", active: true }] });
    if (url === "/api/admin/avatars") return res.json(200, { models: [
      { id: "d4000000-0000-0000-0000-000000000004", name: "Aanya", gender: "female", file: "/models/avatar.vrm", minRole: "public_user", active: true, isDefault: true },
      { id: "d4000000-0000-0000-0000-000000000005", name: "Arif", gender: "male", file: "/models/avatar-male.vrm", minRole: "subscriber", active: true, isDefault: false },
    ] });
    if (url === "/api/admin/plans") return res.json(200, {
      plans: [{ id: "e5000000-0000-0000-0000-000000000002", name: "Premium", price: 499, currency: "BDT", cycle: "monthly", features: ["500 messages/day"], popular: true, active: true }],
      payments: [{ id: "f6000000-0000-0000-0000-000000000006", amount: 499, currency: "BDT", status: "succeeded", provider: "demo", referenceId: "demo_ab12cd34", createdAt: "2026-01-01T00:00:00Z" }],
    });
    if (seg[1] === "admin" && seg[2] === "plans" && seg[3]) return res.json(200, { ok: true });
    if (url === "/api/admin/settings") {
      return res.json(200, { systemSettings: { id: 1, defaultUiLanguage: "en", defaultInputLanguage: "bn", registrationOpen: true, aiModel: "gemini-2.5-flash", framing: { targetY: 1.44, camY: 1.46, camZ: 1.05, fov: 30, locked: true }, updatedAt: "2026-01-01T00:00:00Z" } });
    }
    if (url === "/api/admin/audit") return res.json(200, { audit: [{ id: "07000000-0000-0000-0000-000000000007", userId: user.id, action: "update_flags", resource: "flags", detail: "public_user", createdAt: "2026-01-01T00:00:00Z" }] });

    if (url === "/api/health") return res.json(200, { status: "healthy", timestamp: new Date().toISOString(), services: { database: "healthy", redis: "healthy" }, uptimeSeconds: 1, version: "1.0.0" });
    if (url === "/__hits") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify([...hits])); }

    res.json(404, { error: "not_found" });
  });
};

const server = http.createServer(H);
server.listen(5000, () => console.log("contract stub on :5000"));
process.on("SIGTERM", () => { server.close(); process.exit(0); });
