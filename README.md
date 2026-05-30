# Signal Social Web App

[![CI](https://github.com/Elli2022/signal-social-web-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Elli2022/signal-social-web-app/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/live-demo-00c7b7?logo=netlify&logoColor=white)](https://signal-social-web-app.netlify.app)

Signal Social Web App is a modernized social community frontend rebuilt from an older school final project. The goal of this repository is to show the full upgrade path from a legacy TypeScript app to a cleaner, portfolio-ready product with a modern React stack, safer authentication, automated checks, and a live Netlify deployment.

## Live Links

- Live site: [signal-social-web-app.netlify.app](https://signal-social-web-app.netlify.app)
- Repository: [github.com/Elli2022/signal-social-web-app](https://github.com/Elli2022/signal-social-web-app)

## Highlights

- Rebuilt with React 19, Vite 8, and TypeScript 6
- Firebase Authentication and Cloud Firestore support
- Demo mode fallback powered by `localStorage` when Firebase variables are missing
- Profile editing, avatar selection, posting flow, and session management
- GitHub Actions CI for linting, typechecking, tests, and production builds
- Netlify-ready deployment configuration

## Tech Stack

- React
- Vite
- TypeScript
- Firebase Authentication
- Cloud Firestore
- ESLint
- Vitest
- Netlify

## Running Locally

1. Enable Corepack if needed:

   ```bash
   corepack enable
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Build for production:

   ```bash
   pnpm build
   ```

5. Run the full quality check suite:

   ```bash
   pnpm check
   ```

## Environment Variables

Copy `.env.example` to `.env.local` and provide your Firebase project values:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

If those variables are missing, the app starts in demo mode so the interface can still be explored and developed locally.

## Scripts

- `pnpm dev` starts the local development server
- `pnpm build` creates the production build in `dist/`
- `pnpm preview` serves the production build locally
- `pnpm lint` runs ESLint
- `pnpm typecheck` runs TypeScript without emitting files
- `pnpm test` runs Vitest
- `pnpm check` runs lint, typecheck, tests, and build in sequence

## Project Structure

- `src/App.tsx` coordinates app bootstrap, auth state, and data subscriptions
- `src/components/AuthScreen.tsx` handles sign in, sign up, and demo mode messaging
- `src/components/Dashboard.tsx` contains the member workspace, profile editing, and posting UI
- `src/lib/socialClient.ts` lazily loads the correct data layer for a smaller initial bundle
- `src/lib/firebaseStore.ts` provides the production Firebase data and auth implementation
- `src/lib/demoStore.ts` keeps the app usable without backend secrets

## Deployment

The app is configured for Netlify and published at:

- [https://signal-social-web-app.netlify.app](https://signal-social-web-app.netlify.app)

The repository also includes a Netlify configuration file so the same build settings can be reused for Git-connected deployments.

## Project Background

This repository consolidates several earlier course repositories into one cleaner codebase and one readable project history. It now serves as both an upgraded final project and a stronger public portfolio piece.

Migration details from the repository consolidation are kept in [MIGRATION_NOTES.md](./MIGRATION_NOTES.md).
