# Firestore Structure

Firebase project IDs and web-app configuration belong in the developer's local `.env` file, based on `.env.example`. Firebase client config is public client configuration; never place Firebase Admin credentials or service-account keys in the app.

## Collections

### `users/{uid}`

Created after email registration when Firestore is configured.

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | Must equal the document ID and authenticated user's UID. |
| `displayName` | string | 1–24 characters. |
| `createdAt` | timestamp | Set on profile creation and immutable to clients. |
| `updatedAt` | timestamp | Update time. |

Users can read and update only their own profile. Client-side profile writes are limited by `firestore.rules`.

### `rooms/{roomCode}`

Created and updated by callable Cloud Functions only. A room code is eight characters from an ambiguity-reduced alphabet. The client can read a room only when its signed-in UID is in `playerUids`; client writes and room listing are denied.

| Field | Type | Notes |
| --- | --- | --- |
| `roomCode` | string | Document ID and invite code. |
| `hostUid` | string | UID allowed to start the room. |
| `playerCount` | number | Room capacity from 2 to 4. |
| `playerUids` | string[] | Membership list used by read rules. |
| `players` | object[] | `{ uid, displayName, seat, ready }`; seat assignment is transactional. |
| `status` | string | `waiting`, `playing`, or `completed`. |
| `gameState` | object | Shared engine state initialized at start and updated only by server roll/move functions. |
| `stateVersion` | number | Incremented per accepted action; rejects stale client actions. |
| `lastAction` | object | Most recent action ID and result for idempotent retry handling. |
| `createdAt`, `updatedAt`, `expiresAt` | timestamp | Server-owned timestamps; waiting rooms expire after two hours. |
| `startedAt`, `completedAt` | timestamp | Set by server when a match starts or completes. |

The functions own room creation, seat allocation, readiness, start, die rolls, and token moves. Existing members can submit the room code again to resume their same seat and server-stored game; new members cannot join after start. No automatic forfeit or turn skipping is applied when a player disconnects.

The client subscribes to `gameState` and submits only an action ID, expected state version, and token ID; it cannot write game state directly.

### `matches/{matchId}`

Written atomically by the winning move's Cloud Function transaction. The document ID is the room code; only a listed participant may read it directly, and clients cannot list or write match records.

Fields include `roomCode`, `hostUid`, `playerUids`, `winnerUid`, `winnerColor`, `players` (`uid`, `displayName`, `seat`, `color`), `startedAt`, `completedAt`, `rulesVersion`, and `status: completed`. The move transaction also marks the room completed, so the final board and result record cannot diverge.

## Security status

`firestore.rules` allows a user to manage only their own profile, read rooms they belong to, and get completed match records that list their UID. Client room/match writes and collection listing are denied. Cloud Functions use the Admin SDK and therefore bypass these rules; callable functions enforce membership, host authority, room capacity, and state transitions. Rules and functions still need Firebase Emulator validation and deployment to the intended project.
