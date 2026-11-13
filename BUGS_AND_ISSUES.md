# Bugs and Issues

## Known limitations

- Online matchmaking, private-room joining, authentication, and Firebase security are not implemented. The related screens are still UI scaffolding.
- The game board uses a fixed 320-point size and needs layout validation on small and large Android screens.
- Player profile totals and leaderboard data still come from sample store values; they are not calculated from local history.
- SQLite match history and AsyncStorage settings have passed type checks but have not been exercised on a physical device or development build.
- Bot decisions are heuristic and need more gameplay balancing. Hard mode only considers immediate threats and available moves.
- The capture sound currently reuses the regular token-move sound.

## Checks

- TypeScript strict check: passed.
- ESLint: passed when invoked directly through the installed ESLint entry point.
- Engine and bot rules: 10 tests passed using Node's built-in test runner.
