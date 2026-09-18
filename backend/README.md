# MyAi Backend (.NET 10)

Clean Architecture per the root README (§4.1, §5, §8) — kept deliberately simple:
plain controllers → services → EF Core. No exotic patterns.

## Projects
```
src/
├── MyAi.Domain          entities (README §5 tables)
├── MyAi.Application     DTOs, interfaces, business services
├── MyAi.Infrastructure  EF Core (PostgreSQL), JWT, AES, AI providers, Edge-TTS
└── MyAi.Api             controllers, Program.cs, Swagger
```

## Run (Visual Studio)
1. Open `MyAi.sln` → F5 (docker-compose up also works: `docker compose up`)
2. Swagger: https://localhost:<port>/swagger
3. DB migrations are applied automatically on startup (`DbSeeder.SeedAsync`).

Initial migration (one time, optional):
```
dotnet ef migrations add Init -p src/MyAi.Infrastructure -s src/MyAi.Api
```

## Demo accounts (seeded)
| email | password | role |
|---|---|---|
| admin@demo.com | admin123 | admin |
| sub@demo.com | sub12345 | subscriber |
| public@demo.com | public123 | public_user |

## AI keys
- System default: `AI:ApiKey` in appsettings/env (Gemini API key).
- User keys (subscriber+): stored AES-GCM encrypted (`Encryption:Key`).

## Security (README §3.4)
- **JWT RS256** — key pair at `MyAi.Api/keys/jwt_rsa.pem`, generated on first run
  (mount `keys/` in production; never commit it). Refresh tokens: opaque 64-byte
  random, stored SHA-256-hashed in `refresh_tokens`, 30-day expiry, rotated on
  `POST /api/auth/refresh`, all revoked on `POST /api/auth/logout`.
- **Rate limiting (Redis sliding window, chat endpoint only)** — admin unlimited,
  subscriber 500/day, public_user 50/day, default/anonymous 10/minute; headers
  `X-RateLimit-Limit/Remaining/Reset`. Login/register: fixed window per IP
  (15/min). Redis is fail-soft — when it is down requests pass through and the
  DB daily count still enforces limits.
- **Serilog** console + rolling file `logs/myai-.log` (30 days retained).
- **Hangfire** dashboard `/hangfire` (admin role required) + daily
  `SubscriptionCleanupJob` (expire lapsed subscriptions, purge 2-year-old audit rows).

## Cache
`ICache` (Redis via StackExchange.Redis, fail-soft) caches role feature flags for
60s; admin flag updates refresh the cache entry immediately.

## Lip-sync contract
`POST /api/tts {text, lang, voice, rate, pitch}` →
`{audioBase64, contentType, boundaries:[{charIndex, length, text}]}`
Feed `boundaries` to the frontend `engine.setViseme/boundaryAt` — the same
functions the demo uses today, so the avatar lip-syncs 100% with real audio.

## Frontend (connected — no demo layer)
The Next.js app in `web/` is UI-only: every request goes to this API.
- Default backend origin: `http://localhost:5000` (matches `launchSettings.json`).
  Override with `NEXT_PUBLIC_API_BASE` in `web/.env.local`.
- Run: `docker compose up` (or VS F5) → `cd web && npm install && npm run dev`
  → http://localhost:3000 (seeded demo accounts work).
- Voice: chat audio comes from `POST /api/tts` (Edge-TTS + word-boundary
  offsets → 100% synced lip-sync). "Demo voice" toggle switches to the
  browser voice instead.
- Contract E2E without dotnet: `node web/tuning/dotnetStub.js` (mirrors these
  routes) + `web/tuning/verify10.js` — verifies every frontend call shape.
