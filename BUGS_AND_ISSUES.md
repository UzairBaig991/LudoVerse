# Bugs and Issues

## Known limitations

- Firebase project values are not configured. Email and guest auth are wired but cannot reach Firebase until the developer supplies local `.env` values and enables those providers.
- Google sign-in is not implemented; its UI is marked as pending setup.
- Firestore rules are restrictive scaffolding and have not yet been deployed or emulator-tested.
- Online matchmaking, private-room joining, and server-authoritative move validation are not implemented. The room screens are still UI scaffolding.
- The game board now scales to the app window; its layout still needs validation on small and large Android screens.
- Player profile totals and leaderboard data still come from sample store values; they are not calculated from local history.
- SQLite match history and AsyncStorage settings have passed type checks but have not been exercised on a physical device or development build.
- Bot decisions are heuristic and need more gameplay balancing. Hard mode only considers immediate threats and available moves.
- The generated capture cue needs listening checks on physical devices.

## Checks

- TypeScript strict check: passed.
- Expo lint: passed.
- Android bundle export: passed.
- Engine and bot rules: 12 tests passed using Node's built-in test runner, including full-match simulations.
