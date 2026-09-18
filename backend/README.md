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

## Lip-sync contract
`POST /api/tts {text, lang, voice, rate, pitch}` →
`{audioBase64, contentType, boundaries:[{charIndex, length, text}]}`
Feed `boundaries` to the frontend `engine.setViseme/boundaryAt` — the same
functions the demo uses today, so the avatar lip-syncs 100% with real audio.

## Frontend swap
The Next.js frontend talks to the identical JSON shapes this API exposes.
Set `NEXT_PUBLIC_API_BASE=http://localhost:5000` in `web/.env.local` and the
demo Next.js routes are bypassed.
