# LudoVerse

LudoVerse is an Expo and React Native Ludo game prototype. Local pass-and-play and a heuristic computer opponent use a shared TypeScript game engine. Online play is not implemented yet.

## Stack

- Expo SDK 58, React Native, and TypeScript
- Expo Router
- Zustand
- AsyncStorage for local sound preference
- Expo SQLite for local match history

## Run the app

Install the dependencies with `npm install`, then start the Expo development server:

```sh
npm run start
```

Use a development build to run native functionality. Expo SQLite was added as an SDK-compatible native module, and the SQLite config plugin is enabled in `app.json`.

## Checks

```sh
npm run lint
npx tsc --noEmit
node --experimental-strip-types --test src/lib/ludo.test.mjs src/lib/bot.test.mjs
```

The test command uses Node's built-in test runner and TypeScript type stripping; it does not require Jest.

## Current development stage

Sprint 3 is in progress. See [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) for completed work and pending items, and [BUGS_AND_ISSUES.md](./BUGS_AND_ISSUES.md) for known limitations.

## Backend status

Firebase credentials have not been configured. Authentication, online rooms, authoritative server-side moves, matchmaking, rewards, and social features remain future work. Do not treat local client-side play as secure online multiplayer.
