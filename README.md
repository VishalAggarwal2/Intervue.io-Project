# Resilient Live Polling System

A full-stack real-time polling application with **Teacher** and **Student** personas, built with TypeScript throughout.

## Key Features

| Feature | Detail |
|---|---|
| **State Recovery** | Refresh the browser — poll state restores instantly from the server |
| **Timer Sync** | Students joining mid-poll get remaining time from the server, not a fresh 60s |
| **Race Condition Prevention** | MongoDB atomic update prevents double-voting even with concurrent requests |
| **Server Restart Resilience** | Active polls are recovered from MongoDB on server startup |
| **Real-time Results** | Live bar charts update as votes come in |
| **Chat** | Teacher ↔ Student chat popup stored in DB |
| **Poll History** | All completed polls with results, fetched from DB |
| **Student Management** | Teacher can kick students from the session |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: Socket.io
- **Database**: MongoDB + Mongoose
- **Architecture**: Controller → Service pattern; Socket Handler separate from business logic

---

## Folder Structure

```
LearnProject/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── controllers/
│   │   │   └── PollController.ts    # REST endpoint handlers
│   │   ├── middleware/
│   │   │   └── errorHandler.ts      # Global error handling
│   │   ├── models/
│   │   │   ├── Poll.ts              # Mongoose Poll schema
│   │   │   └── Chat.ts              # Mongoose Chat schema
│   │   ├── routes/
│   │   │   └── pollRoutes.ts        # Express REST routes
│   │   ├── services/
│   │   │   ├── PollService.ts       # Business logic (extends EventEmitter)
│   │   │   └── ChatService.ts       # Chat persistence logic
│   │   ├── socket/
│   │   │   └── PollSocketHandler.ts # Socket event registration
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript interfaces
│   │   └── server.ts                # Entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Chat/
    │   │   │   └── ChatPopup.tsx
    │   │   ├── Common/
    │   │   │   ├── ResultsChart.tsx
    │   │   │   └── Timer.tsx
    │   │   ├── Student/
    │   │   │   ├── NameEntry.tsx
    │   │   │   ├── QuestionCard.tsx
    │   │   │   ├── ResultsView.tsx
    │   │   │   └── StudentDashboard.tsx
    │   │   └── Teacher/
    │   │       ├── CreatePoll.tsx
    │   │       ├── LiveResults.tsx
    │   │       ├── PollHistory.tsx
    │   │       ├── StudentList.tsx
    │   │       └── TeacherDashboard.tsx
    │   ├── contexts/
    │   │   ├── AppContext.tsx        # useReducer global state
    │   │   └── SocketContext.tsx     # Socket.io client instance
    │   ├── hooks/
    │   │   ├── useSocketEvents.ts    # Maps socket events → dispatch
    │   │   └── useTimer.ts          # Client-side countdown
    │   ├── pages/
    │   │   └── LandingPage.tsx
    │   ├── services/
    │   │   └── api.ts               # Axios REST client
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run dev
```

Server starts at `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App starts at `http://localhost:5173`

### 3. Usage

1. Open `http://localhost:5173` → choose **Teacher** or **Student**
2. Teacher: create a poll with question, options, and timer
3. Students: enter a name → receive the question → submit answer
4. Both see live results in real-time
5. **Refresh either page at any time** — state recovers seamlessly

---

## Architecture: Separation of Concerns

```
Client                    Backend
──────                    ───────
Socket event emitted  →   PollSocketHandler (receives, validates)
                      →   PollService (business logic, DB)
                      ←   EventEmitter: 'poll:ended'
                      ←   io.emit() broadcasts to all clients
```

- `PollSocketHandler` never contains business logic — it delegates to `PollService`
- `PollService` never imports socket — it uses EventEmitter for decoupled callbacks
- `PollController` handles REST routes independently of real-time logic

---

## Resilience Design

| Scenario | Behavior |
|---|---|
| Teacher refreshes mid-poll | `teacher:join` → server sends active poll + remaining time |
| Student joins 30s late into 60s poll | `student:join` → server calculates `60 - elapsed = 30s` remaining |
| Student refreshes after voting | `state:sync` includes `hasVoted: true` — won't be asked again |
| Student tries to vote twice | MongoDB atomic `$ne` check prevents it at DB level |
| Server restarts mid-poll | On startup, `pollService.initialize()` restores active poll from DB |

---

## Socket Events Reference

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `teacher:join` | — | Announce as teacher, get state sync |
| `student:join` | `{ name, studentId }` | Announce as student, get state sync |
| `poll:create` | `{ question, options, timer }` | Teacher creates a poll |
| `poll:vote` | `{ pollId, option, studentId }` | Student submits vote |
| `student:kick` | `{ studentSocketId }` | Teacher kicks a student |
| `chat:send` | `{ message, sender, role }` | Send chat message |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `state:sync` | Full state | Sent on join/reconnect for resilience |
| `poll:started` | `{ poll, remainingTime }` | New poll created |
| `poll:results_update` | `{ results }` | Vote received, results updated |
| `poll:ended` | `{ results }` | Timer expired or poll ended |
| `students:update` | `{ students }` | Student list changed |
| `vote:confirmed` | `{ option }` | Student's vote accepted |
| `poll:can_create_update` | `{ canCreate }` | Teacher create permission changed |
| `chat:message` | ChatMessage | New chat message |
| `student:kicked` | `{ message }` | Student was removed |
| `name:taken` | `{ message }` | Chosen name already in use |
| `error` | `{ message }` | General error |

---

## Deployment

### Backend (e.g. Railway, Render)
```bash
cd backend
npm run build
npm start
```
Set env vars: `MONGODB_URI`, `FRONTEND_URL`, `PORT`

### Frontend (e.g. Vercel, Netlify)
```bash
cd frontend
npm run build
# Deploy the `dist/` folder
```
Set env var: `VITE_BACKEND_URL=https://your-backend.com`
# Intervue.io-Project
