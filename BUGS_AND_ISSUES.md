# Bugs and Issues

## Known limitations

- Online matchmaking, private-room joining, authentication, and Firebase security are not implemented. The related screens are still UI scaffolding.
- The game board now scales to the app window; its layout still needs validation on small and large Android screens.
- Player profile totals and leaderboard data still come from sample store values; they are not calculated from local history.
- SQLite match history and AsyncStorage settings have passed type checks but have not been exercised on a physical device or development build.
- Bot decisions are heuristic and need more gameplay balancing. Hard mode only considers immediate threats and available moves.
- The generated capture cue needs listening checks on physical devices.

## Checks

- TypeScript strict check: passed.
- ESLint: passed when invoked directly through the installed ESLint entry point.
- Engine and bot rules: 12 tests passed using Node's built-in test runner, including full-match simulations.
