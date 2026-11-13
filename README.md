# LudoVerse

LudoVerse is an Expo and React Native Ludo game prototype. Local pass-and-play and a heuristic computer opponent use a shared TypeScript game engine. Sprint 4 now includes a Firebase-backed private-room lobby; synchronized online turns are still under development.

## Stack

- Expo SDK 58, React Native, and TypeScript
- Expo Router
- Zustand
- AsyncStorage for local sound preference
- Expo SQLite for local match history
- Firebase Authentication and Firestore for identity and private-room lobby state
- Firebase Cloud Functions for server-owned room membership and lifecycle

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

## Firebase setup

Copy `.env.example` to `.env` and fill in the web-app configuration values from the Firebase Console. These Firebase client values are public app configuration; never put an Admin SDK service-account key in the app or an `EXPO_PUBLIC_` variable.

Enable Email/Password and Anonymous sign-in in Firebase Authentication. Create the default Firestore database and deploy the checked-in `firestore.rules` before relying on profile reads or writes. Without `.env` values, account sign-in stays unavailable and local offline play continues to work. Google sign-in and online rooms are not implemented yet.

Private rooms also require deploying the callable functions in `functions/` (`npm install` there, then `npm run build`) and deploying the Firestore rules. Functions use the Admin SDK, so do not expose service credentials to the client. Room create/join/ready/start are server-authoritative; the current start action does not launch a synchronized online board yet.

See [docs/FIRESTORE_SCHEMA.md](./docs/FIRESTORE_SCHEMA.md) for the planned collections and access model.

## Current development stage

Sprint 4 is in progress. See [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) for completed work and pending items, and [BUGS_AND_ISSUES.md](./BUGS_AND_ISSUES.md) for known limitations.

## Backend status

Firebase project values have not been provided. Email and anonymous authentication and private-room lobby code are wired but cannot connect until configured and deployed. Authoritative server-side dice and moves, matchmaking, rewards, reconnect state, and social features remain future work. Do not treat local client-side play as secure online multiplayer.
