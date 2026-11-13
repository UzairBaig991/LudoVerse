# LudoVerse Development Progress

Updated: 2026-11-13

## Current stage

Sprint 4 — Firebase and online multiplayer (in progress)

## Sprint status

### Sprint 1 — Foundation and UI

- Expo Router routes and the initial home, onboarding, authentication, mode selection, profile, lobby, and results screens exist.
- A shared dark theme and initial game screen are in place.
- The auth screen started as UI scaffolding; email and anonymous Firebase Auth wiring is now tracked under Sprint 4.

### Sprint 2 — Board and game engine

- Added a 52-cell board coordinate loop and centralized TypeScript game state and rules.
- Implemented legal moves, six-to-exit, exact finishing, safe squares, captures, extra turns, and winner detection.
- Updated the game screen to let players choose a highlighted legal token.
- Added engine tests for movement and rule edge cases.

### Sprint 3 — Offline play and polish

- Added Easy, Medium, and Hard bot move selection using the shared rules engine.
- Added automatic bot turns for a two-player game and bot difficulty selection.
- Persisted the sound-effects setting with AsyncStorage.
- Added SQLite local match records and a match-history screen linked from the profile.
- Removed the fixed coin reward from the local results screen.
- Existing token and dice animations and sound effects are used during local play.
- Made the board and token sizing respond to the app window dimensions.
- Added reduced-motion support for token movement and dice rotation.
- Added a distinct capture sound for human and bot captures.
- Simulated four deterministic bot-versus-bot matches and fixed home-lane progress so tokens continue to goal.

Pending in this sprint:

- Validate SQLite persistence and gameplay on Android and iOS devices.
- Review board visual layout across device sizes on physical devices.
- Balance the bot through human playthroughs and listen to the new capture sound on device.

### Sprint 4 — Firebase and online multiplayer

- Added the Firebase JS SDK using the SDK-compatible Expo installer.
- Added env-based Firebase app initialization and persistent React Native Auth setup.
- Connected email registration, email sign-in, password reset, and anonymous guest sign-in to Firebase Auth.
- Kept local play available without Firebase configuration and disabled the unfinished Google flow.
- Added restrictive Firestore rules and documented the planned data structure.
- Added callable Cloud Functions for private-room creation, joining, readiness, and host-only start; seat assignment and state transitions run in Firestore transactions.
- Connected the create/join lobby screens to the room callables and a member-only live room listener; removed the local fake-room store.
- Restricted client room reads to room members and denied all direct room writes.
- Starting a room now marks it as playing; the UI explains that synchronized turns are a later milestone.

Pending in this sprint:

- Add local Firebase project values and enable the selected Auth providers.
- Validate account flows and profile creation against the configured Firebase project.
- Configure Firebase Functions, deploy functions/rules, and verify private-room lifecycle with multiple authenticated devices.
- Add Cloud Functions for authoritative dice, moves, matchmaking, and reconnect state.
- Add Cloud Functions for authoritative dice, moves, matchmaking, and reconnect state.
- Test Firestore rules with the Firebase Emulator before deployment.

### Sprint 5 — Security and social features

- Pending: validate Firestore rules, add Cloud Functions for authoritative dice and moves, and implement invitations, reactions, and rewards.

### Sprint 6 — Release preparation

- Pending: device matrix testing, performance work, Android release build, and release documentation.

## Checks run

- `tsc --noEmit` — passed.
- `npm run lint` — passed.
- Android JavaScript bundle export — passed.
- Local engine and bot tests via Node's built-in test runner — 12 passed, including four deterministic full-match simulations.

Firebase Auth and private-room callables could not be exercised against a live project because project configuration has not been provided. Cloud Functions have not been deployed. SQLite-backed history still needs a native device run.
