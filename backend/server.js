"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const PollSocketHandler_1 = require("./socket/PollSocketHandler");
const PollService_1 = __importDefault(require("./services/PollService"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigin = isDev
    ? /^http:\/\/localhost:\d+$/
    : process.env.FRONTEND_URL || 'http://localhost:5173';
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
app.use((0, cors_1.default)({ origin: allowedOrigin, credentials: true }));
app.use(express_1.default.json());
// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/rooms', roomRoutes_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// ── Startup ─────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;
const start = async () => {
    await (0, database_1.connectDatabase)();
    await PollService_1.default.initialize();
    (0, PollSocketHandler_1.initializePollSocket)(io);
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Accepting connections from: ${allowedOrigin}`);
    });
};
start().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map