# Signal Social Web App

Detta repo har moderniserats från en äldre Parcel-app med direkt DOM-hantering och osäker lösenordslagring till en modern frontend med Vite, React, TypeScript och en säkrare Firebase-struktur.

## Ny stack

- React 19.2
- Vite 8
- TypeScript 6
- Firebase Authentication
- Cloud Firestore
- ESLint flat config
- Vitest för grundläggande enhetstester

## Förbättringar

- Konto- och sessionshantering är flyttad från egen lösenordslagring till riktig auth.
- Dataflödet är uppdelat i tydliga lager för auth, profiler och inlägg.
- Appen har ett inbyggt demoläge via `localStorage` om Firebase-variabler saknas.
- Bygget är anpassat för modern utveckling och deployment via Netlify.

## Kom igång

1. Aktivera pakethanteraren om det behövs:

   ```bash
   corepack enable
   ```

2. Installera beroenden:

   ```bash
   pnpm install
   ```

3. Starta utvecklingsservern:

   ```bash
   pnpm dev
   ```

4. Bygg produktionsversionen:

   ```bash
   pnpm build
   ```

5. Kör kvalitetskontroller:

   ```bash
   pnpm check
   ```

## Firebase-konfiguration

Kopiera `.env.example` till `.env.local` och fyll i:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Om variablerna saknas startar appen i demoläge så att gränssnittet fortfarande går att utveckla och testa lokalt.

## Arkitektur

- `src/App.tsx` håller ihop session, realtidsdata och huvudflöden.
- `src/lib/socialClient.ts` laddar rätt datalager vid behov för mindre startpaket.
- `src/lib/firebaseStore.ts` innehåller det riktiga data- och authlagret.
- `src/lib/demoStore.ts` gör appen körbar utan backendhemligheter.

## CI

Repot innehåller en GitHub Actions-workflow i `.github/workflows/ci.yml` som kör install, lint, typkontroll, tester och build på `main` och pull requests.

## Historik

Detta repo är den konsoliderade slutversionen av flera tidigare GitHub-repon som slagits ihop till en gemensam historik. Äldre migreringsdetaljer finns kvar i `MIGRATION_NOTES.md`.
