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
npm run build --prefix functions
npm test --prefix functions
```

The app tests use Node's built-in test runner and TypeScript type stripping; the Functions test command builds the backend and verifies room-code and seat-allocation helpers.

## Firebase setup

Copy `.env.example` to `.env` and fill in the web-app configuration values from the Firebase Console. These Firebase client values are public app configuration; never put an Admin SDK service-account key in the app or an `EXPO_PUBLIC_` variable.

Enable Email/Password and Anonymous sign-in in Firebase Authentication. Create the default Firestore database and deploy the checked-in `firestore.rules` before relying on profile reads or writes. Without `.env` values, account sign-in stays unavailable and local offline play continues to work. Google sign-in is not implemented yet.

Private rooms also require deploying the callable functions in `functions/` (`npm install` there, then `npm run build`) and deploying the Firestore rules. Functions use the Admin SDK, so do not expose service credentials to the client. Room lifecycle, dice rolls, and moves are server-authoritative; signed-in room members receive shared game state through Firestore.

See [docs/FIRESTORE_SCHEMA.md](./docs/FIRESTORE_SCHEMA.md) for the planned collections and access model.

## Current development stage

Sprint 4 is in progress. See [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) for completed work and pending items, and [BUGS_AND_ISSUES.md](./BUGS_AND_ISSUES.md) for known limitations.

## Backend status

Firebase project values have not been provided. Email and anonymous authentication, private rooms, and authoritative online turns are wired but cannot connect until configured and deployed. Matchmaking, reconnect/abandoned-turn handling, rewards, and social features remain future work. Local client-side play is not secure online multiplayer.
