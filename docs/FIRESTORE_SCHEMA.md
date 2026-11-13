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

### `rooms/{roomId}`

Reserved for private rooms and matchmaking. Clients currently have no read or write access. A later Cloud Function implementation should own room creation, seat assignment, readiness, state transitions, and cleanup.

Suggested fields: `status`, `hostUid`, `playerCount`, `players`, `createdAt`, `updatedAt`, and `expiresAt`. Do not write authoritative game state from the mobile client.

### `matches/{matchId}`

Reserved for completed online matches. A trusted Cloud Function should validate the final state and own result and reward writes.

Suggested fields: `roomId`, `playerUids`, `winnerUid`, `rankings`, `startedAt`, `completedAt`, and `rulesVersion`.

## Security status

`firestore.rules` allows a user to manage only their own profile and denies all other client access. Room and match access stays denied until server functions and rules are implemented and tested together. Deploying rules requires linking this workspace to the intended Firebase project first.
