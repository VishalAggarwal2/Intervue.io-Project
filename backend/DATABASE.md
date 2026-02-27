# Database Design — Intervue Poll

MongoDB is used as the primary datastore. There are four collections: **rooms**, **polls**, **templates**, and **chats**.

---

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        MONGODB COLLECTIONS                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘


 ┌──────────────────────────┐          ┌──────────────────────────────────────────────────────┐
 │          ROOM             │          │                       POLL                           │
 ├──────────────────────────┤  1 ──── * ├──────────────────────────────────────────────────────┤
 │ _id         ObjectId (PK)│◄─────────┤ _id            ObjectId (PK)                         │
 │ roomCode    String (UQ)  │  polls[] │ roomCode       String (FK → Room.roomCode, indexed)  │
 │ name        String       │          │ question       String                                 │
 │ status      String       │          │ type           String  (mcq|truefalse|rating|open)    │
 │   active | closed        │          │ options        String[]                               │
 │ polls       ObjectId[]   │          │ correctAnswer  String? (optional)                     │
 │ createdAt   Date         │          │ isAnonymous    Boolean                                │
 │ updatedAt   Date         │          │ timer          Number  (seconds, 5–300)               │
 └──────────────────────────┘          │ startTime      Date                                   │
                                       │ endTime        Date?                                  │
                                       │ status         String  (active | completed)           │
                                       │ votes          Vote[]  ──────────────────────┐        │
                                       │ results        Result[]─────────────────────┐│        │
                                       │ createdAt      Date                         ││        │
                                       │ updatedAt      Date                         ││        │
                                       └─────────────────────────────────────────────┘┘        │
                                                                                               │
                                        ┌──────────────────────────┐  (embedded in Poll)       │
                                        │          VOTE             │◄──────────────────────────┘
                                        ├──────────────────────────┤
                                        │ studentId    String      │
                                        │ studentName  String      │
                                        │ option       String      │
                                        │ votedAt      Date        │
                                        │ isCorrect    Boolean?    │
                                        │ score        Number?     │
                                        └──────────────────────────┘

                                        ┌──────────────────────────┐  (embedded in Poll)
                                        │       POLL RESULT         │
                                        ├──────────────────────────┤
                                        │ option        String     │
                                        │ count         Number     │
                                        │ percentage    Number     │
                                        │ textResponses String[]?  │
                                        └──────────────────────────┘


 ┌──────────────────────────┐
 │        TEMPLATE           │
 ├──────────────────────────┤
 │ _id         ObjectId (PK)│
 │ name        String       │
 │ questions   TplQuestion[]│──┐
 │ createdAt   Date         │  │
 │ updatedAt   Date         │  │
 └──────────────────────────┘  │
                                │  (embedded in Template)
                                │  ┌──────────────────────────┐
                                └─►│    TEMPLATE QUESTION      │
                                   ├──────────────────────────┤
                                   │ question      String     │
                                   │ type          String     │
                                   │ options       String[]   │
                                   │ correctAnswer String?    │
                                   │ timer         Number     │
                                   │ isAnonymous   Boolean    │
                                   └──────────────────────────┘


 ┌──────────────────────────┐
 │          CHAT             │
 ├──────────────────────────┤   (standalone, not linked to Room or Poll)
 │ _id       ObjectId (PK)  │
 │ sender    String         │
 │ role      String         │
 │   teacher | student      │
 │ message   String (≤500)  │
 │ timestamp Date (indexed) │
 └──────────────────────────┘
```

---

## Collection Details

### `rooms`
Represents a live session created by a teacher. Holds references to all polls that ran within it.

| Field      | Type       | Constraints                        | Notes                          |
|------------|------------|------------------------------------|--------------------------------|
| `_id`      | ObjectId   | PK, auto-generated                 |                                |
| `roomCode` | String     | Required, Unique, Uppercase, Trim  | 6-char unambiguous alphanumeric|
| `name`     | String     | Default: `"Untitled Room"`         |                                |
| `status`   | String     | `active` \| `closed`               | Default: `active`              |
| `polls`    | ObjectId[] | Ref → `Poll`                       | Ordered by creation            |
| `createdAt`| Date       | Auto (timestamps)                  |                                |
| `updatedAt`| Date       | Auto (timestamps)                  |                                |

---

### `polls`
One poll per question asked in a room. Votes and computed results are stored as embedded arrays.

| Field           | Type      | Constraints               | Notes                                  |
|-----------------|-----------|---------------------------|----------------------------------------|
| `_id`           | ObjectId  | PK                        |                                        |
| `roomCode`      | String    | Required, Indexed         | Denormalised for fast room queries     |
| `question`      | String    | Required                  |                                        |
| `type`          | String    | `mcq\|truefalse\|rating\|openended` | Default: `mcq`             |
| `options`       | String[]  |                           | Empty for openended                    |
| `correctAnswer` | String    | Optional                  | Omit for rating/openended              |
| `isAnonymous`   | Boolean   | Default: `false`          | Hides student names in results         |
| `timer`         | Number    | Required, 5–300           | Seconds                                |
| `startTime`     | Date      | Required                  |                                        |
| `endTime`       | Date      | Optional                  | Set when poll completes                |
| `status`        | String    | `active` \| `completed`   | Default: `active`                      |
| `votes`         | Vote[]    | Embedded                  | One entry per student                  |
| `results`       | Result[]  | Embedded                  | Recomputed on every vote               |
| `createdAt`     | Date      | Auto                      |                                        |

**Embedded: Vote**

| Field        | Type    | Notes                                         |
|--------------|---------|-----------------------------------------------|
| `studentId`  | String  | Stored in browser `sessionStorage`            |
| `studentName`| String  |                                               |
| `option`     | String  |                                               |
| `votedAt`    | Date    |                                               |
| `isCorrect`  | Boolean | Null if no correct answer defined             |
| `score`      | Number  | 10 pts for correct, 0 otherwise               |

**Embedded: PollResult**

| Field           | Type     | Notes                                  |
|-----------------|----------|----------------------------------------|
| `option`        | String   |                                        |
| `count`         | Number   | Total votes for this option            |
| `percentage`    | Number   | 0–100, recomputed per vote             |
| `textResponses` | String[] | Only populated for `openended` type    |

---

### `templates`
Reusable multi-question sets saved by teachers. Completely standalone — no foreign key to Room.

| Field       | Type             | Notes                      |
|-------------|------------------|----------------------------|
| `_id`       | ObjectId         | PK                         |
| `name`      | String           | Required                   |
| `questions` | TplQuestion[]    | Embedded array (ordered)   |
| `createdAt` | Date             | Auto                       |

**Embedded: TemplateQuestion**

| Field           | Type    |
|-----------------|---------|
| `question`      | String  |
| `type`          | String  |
| `options`       | String[]|
| `correctAnswer` | String? |
| `timer`         | Number  |
| `isAnonymous`   | Boolean |

---

### `chats`
Global chat messages. Not scoped to a room or poll — all messages share one collection.
Indexed on `timestamp DESC` for efficient history queries.

| Field       | Type   | Constraints              |
|-------------|--------|--------------------------|
| `_id`       | ObjectId | PK                     |
| `sender`    | String | Required                 |
| `role`      | String | `teacher` \| `student`   |
| `message`   | String | Required, max 500 chars  |
| `timestamp` | Date   | Default: now, Indexed    |

---

## Relationships Summary

```
Room  1 ──── *  Poll       (Room.polls[] stores ObjectId refs to Poll documents)
Poll  1 ──── *  Vote       (embedded subdocument array inside Poll)
Poll  1 ──── *  PollResult (embedded subdocument array inside Poll)
Template 1 ── * TemplateQuestion (embedded subdocument array inside Template)
Chat            (standalone — no foreign key to Room or Poll)
```

## Indexes

| Collection | Field      | Type    | Purpose                              |
|------------|------------|---------|--------------------------------------|
| `rooms`    | `roomCode` | Unique  | Fast room lookup by code             |
| `polls`    | `roomCode` | Index   | Fetch all polls for a room           |
| `chats`    | `timestamp`| Index   | Sort messages chronologically        |

## In-Memory State (not persisted)

The following runtime state is kept in `PollSocketHandler` memory and lost on server restart (polls themselves are recovered from MongoDB via `PollService.initialize()`):

| Structure           | Key             | Value                              |
|---------------------|-----------------|------------------------------------|
| `roomStates`        | `roomCode`      | `{ teacherSocketId, connectedStudents Map, leaderboard Map, pollQueue[] }` |
| `socketToRoom`      | `socketId`      | `roomCode`                         |
