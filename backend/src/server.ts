import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { initializePollSocket } from './socket/PollSocketHandler';
import pollService from './services/PollService';
import roomRoutes from './routes/roomRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigin = isDev
  ? /^http:\/\/localhost:\d+$/
  : process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/rooms', roomRoutes);

app.use(notFound);
app.use(errorHandler);

// ── Startup ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;

const start = async (): Promise<void> => {
  await connectDatabase();
  await pollService.initialize();
  initializePollSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Accepting connections from: ${allowedOrigin}`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
