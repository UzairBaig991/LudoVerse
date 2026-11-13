# LudoVerse Development Progress

Updated: 2026-11-13

## Current stage

Sprint 3 — Offline gameplay and visual polish (in progress)

## Sprint status

### Sprint 1 — Foundation and UI

- Expo Router routes and the initial home, onboarding, authentication, mode selection, profile, lobby, and results screens exist.
- A shared dark theme and initial game screen are in place.
- Authentication and online/lobby screens are UI scaffolding; they are not connected to a backend.

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

- Pending: Firebase setup, authenticated accounts, private rooms, matchmaking, synchronization, and reconnect handling.

### Sprint 5 — Security and social features

- Pending: server-authoritative dice and moves, Firestore rules, Cloud Functions, invitations, reactions, and rewards.

### Sprint 6 — Release preparation

- Pending: device matrix testing, performance work, Android release build, and release documentation.

## Checks run

- `tsc --noEmit` — passed.
- ESLint via `node node_modules/eslint/bin/eslint.js .` — passed.
- Local engine and bot tests via Node's built-in test runner — 12 passed, including four deterministic full-match simulations.

The SQLite-backed history still needs a native device run; TypeScript checks do not verify native database behavior.
