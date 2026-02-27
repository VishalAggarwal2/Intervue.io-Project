"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePollSocket = initializePollSocket;
const PollService_1 = __importDefault(require("../services/PollService"));
const RoomService_1 = __importDefault(require("../services/RoomService"));
const ChatService_1 = __importDefault(require("../services/ChatService"));
// Per-room in-memory session state
const roomStates = new Map();
// Track which room each socket belongs to
const socketToRoom = new Map(); // socketId → roomCode
function getOrCreateRoom(roomCode) {
    if (!roomStates.has(roomCode)) {
        roomStates.set(roomCode, {
            teacherSocketId: null,
            connectedStudents: new Map(),
            leaderboard: new Map(),
            pollQueue: [],
        });
    }
    return roomStates.get(roomCode);
}
function canCreateNewPoll(roomCode) {
    const activePoll = PollService_1.default.getActivePoll(roomCode);
    if (!activePoll)
        return true;
    const room = roomStates.get(roomCode);
    if (!room || room.connectedStudents.size === 0)
        return true;
    return Array.from(room.connectedStudents.values()).every((s) => s.votedInCurrentPoll);
}
function broadcastStudentList(io, roomCode) {
    const room = roomStates.get(roomCode);
    if (!room?.teacherSocketId)
        return;
    io.to(`teacher:${roomCode}`).emit('students:update', {
        students: Array.from(room.connectedStudents.values()),
    });
}
function broadcastLeaderboard(io, roomCode) {
    const room = roomStates.get(roomCode);
    if (!room)
        return;
    const leaderboard = Array.from(room.leaderboard.values()).sort((a, b) => b.score - a.score);
    io.to(roomCode).emit('leaderboard:update', { leaderboard });
}
function broadcastCanCreate(io, roomCode) {
    const room = roomStates.get(roomCode);
    if (!room?.teacherSocketId)
        return;
    io.to(`teacher:${roomCode}`).emit('poll:can_create_update', {
        canCreate: canCreateNewPoll(roomCode),
    });
}
function broadcastQueue(io, roomCode) {
    const room = roomStates.get(roomCode);
    if (!room?.teacherSocketId)
        return;
    io.to(`teacher:${roomCode}`).emit('queue:update', { queue: room.pollQueue });
}
function initializePollSocket(io) {
    // Handle timer-expiry from PollService
    PollService_1.default.on('poll:ended', ({ roomCode, results, correctAnswer }) => {
        io.to(roomCode).emit('poll:ended', { results, correctAnswer: correctAnswer ?? null });
        const room = roomStates.get(roomCode);
        if (!room)
            return;
        room.connectedStudents.forEach((s) => {
            s.votedInCurrentPoll = false;
        });
        broadcastStudentList(io, roomCode);
        // Auto-start next queued poll if any
        if (room.pollQueue.length > 0) {
            const next = room.pollQueue.shift();
            broadcastQueue(io, roomCode);
            (async () => {
                try {
                    const poll = await PollService_1.default.createPoll(roomCode, next.question, next.type, next.options, next.timer, next.correctAnswer, next.isAnonymous ?? false);
                    await RoomService_1.default.addPollToRoom(roomCode, poll._id.toString());
                    room.connectedStudents.forEach((s) => { s.votedInCurrentPoll = false; });
                    io.to(roomCode).emit('poll:started', { poll: poll.toObject(), remainingTime: next.timer });
                    io.to(`teacher:${roomCode}`).emit('poll:can_create_update', { canCreate: false });
                    broadcastStudentList(io, roomCode);
                    broadcastLeaderboard(io, roomCode);
                    console.log(`Auto-started queued poll in room ${roomCode}: "${poll.question}"`);
                }
                catch (err) {
                    console.error(`Failed to auto-start queued poll in room ${roomCode}:`, err);
                    io.to(`teacher:${roomCode}`).emit('poll:can_create_update', { canCreate: true });
                }
            })();
        }
        else {
            io.to(`teacher:${roomCode}`).emit('poll:can_create_update', { canCreate: true });
        }
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // ─── Teacher Join Room ─────────────────────────────────────────────────
        socket.on('teacher:join-room', async ({ roomCode }) => {
            const code = roomCode.toUpperCase();
            const dbRoom = await RoomService_1.default.getRoom(code);
            if (!dbRoom) {
                socket.emit('error', { message: `Room ${code} not found.` });
                return;
            }
            const room = getOrCreateRoom(code);
            room.teacherSocketId = socket.id;
            socketToRoom.set(socket.id, code);
            socket.join(code);
            socket.join(`teacher:${code}`);
            const activePoll = PollService_1.default.getActivePoll(code);
            const remainingTime = PollService_1.default.getRemainingTime(code);
            const pollHistory = await PollService_1.default.getPollHistory(code);
            const chatMessages = await ChatService_1.default.getRecentMessages();
            const leaderboard = Array.from(room.leaderboard.values()).sort((a, b) => b.score - a.score);
            socket.emit('state:sync', {
                role: 'teacher',
                roomCode: code,
                roomName: dbRoom.name,
                activePoll: activePoll ? { ...activePoll.toObject(), remainingTime } : null,
                students: Array.from(room.connectedStudents.values()),
                pollHistory,
                chatMessages,
                leaderboard,
                canCreatePoll: canCreateNewPoll(code),
                pollQueue: room.pollQueue,
            });
            console.log(`Teacher joined room: ${code}`);
        });
        // ─── Student Join Room ─────────────────────────────────────────────────
        socket.on('student:join-room', async ({ roomCode, name, studentId, }) => {
            const code = roomCode.toUpperCase();
            const dbRoom = await RoomService_1.default.getRoom(code);
            if (!dbRoom || dbRoom.status === 'closed') {
                socket.emit('room:error', { message: `Room ${code} not found or has been closed.` });
                return;
            }
            const room = getOrCreateRoom(code);
            // Name uniqueness check
            const nameTaken = Array.from(room.connectedStudents.values()).some((s) => s.name.toLowerCase() === name.toLowerCase() && s.socketId !== socket.id);
            if (nameTaken) {
                socket.emit('name:taken', { message: `"${name}" is already in use in this room.` });
                return;
            }
            const activePoll = PollService_1.default.getActivePoll(code);
            const remainingTime = PollService_1.default.getRemainingTime(code);
            const chatMessages = await ChatService_1.default.getRecentMessages();
            const hasVoted = activePoll
                ? activePoll.votes.some((v) => v.studentId === studentId)
                : false;
            const votedOption = activePoll
                ? activePoll.votes.find((v) => v.studentId === studentId)?.option ?? null
                : null;
            const student = {
                socketId: socket.id,
                studentId,
                name,
                votedInCurrentPoll: hasVoted,
            };
            room.connectedStudents.set(socket.id, student);
            socketToRoom.set(socket.id, code);
            socket.join(code);
            const leaderboard = Array.from(room.leaderboard.values()).sort((a, b) => b.score - a.score);
            socket.emit('state:sync', {
                role: 'student',
                roomCode: code,
                roomName: dbRoom.name,
                activePoll: activePoll ? { ...activePoll.toObject(), remainingTime } : null,
                hasVoted,
                votedOption,
                chatMessages,
                leaderboard,
            });
            broadcastStudentList(io, code);
            broadcastCanCreate(io, code);
            console.log(`Student "${name}" joined room: ${code}`);
        });
        // ─── Poll Create ───────────────────────────────────────────────────────
        socket.on('poll:create', async ({ roomCode, question, type, options, timer, correctAnswer, isAnonymous, }) => {
            const code = roomCode.toUpperCase();
            const room = roomStates.get(code);
            if (!room || socket.id !== room.teacherSocketId) {
                socket.emit('error', { message: 'Unauthorized.' });
                return;
            }
            if (!canCreateNewPoll(code)) {
                socket.emit('error', { message: 'Not all students have answered the current poll yet.' });
                return;
            }
            if (!question?.trim()) {
                socket.emit('error', { message: 'Question is required.' });
                return;
            }
            try {
                const poll = await PollService_1.default.createPoll(code, question.trim(), type || 'mcq', options || [], timer, correctAnswer || undefined, isAnonymous ?? false);
                await RoomService_1.default.addPollToRoom(code, poll._id.toString());
                room.connectedStudents.forEach((s) => {
                    s.votedInCurrentPoll = false;
                });
                io.to(code).emit('poll:started', {
                    poll: poll.toObject(),
                    remainingTime: timer,
                });
                io.to(`teacher:${code}`).emit('poll:can_create_update', { canCreate: false });
                broadcastStudentList(io, code);
                broadcastLeaderboard(io, code);
                console.log(`Poll created in room ${code}: "${question}"`);
            }
            catch (err) {
                socket.emit('error', { message: err instanceof Error ? err.message : 'Failed to create poll.' });
            }
        });
        // ─── Student Vote ──────────────────────────────────────────────────────
        socket.on('poll:vote', async ({ roomCode, pollId, option, studentId, }) => {
            const code = roomCode.toUpperCase();
            const room = roomStates.get(code);
            const student = room?.connectedStudents.get(socket.id);
            if (!student) {
                socket.emit('error', { message: 'Not registered in this room.' });
                return;
            }
            if (student.studentId !== studentId) {
                socket.emit('error', { message: 'Student ID mismatch.' });
                return;
            }
            const result = await PollService_1.default.submitVote(code, pollId, studentId, student.name, option);
            if (result.success) {
                student.votedInCurrentPoll = true;
                // Update leaderboard if scoring is applicable
                if (result.isCorrect !== undefined) {
                    const existing = room.leaderboard.get(studentId) ?? {
                        studentId,
                        studentName: student.name,
                        score: 0,
                        totalAnswered: 0,
                        correctAnswers: 0,
                    };
                    existing.totalAnswered++;
                    if (result.isCorrect) {
                        existing.correctAnswers++;
                        existing.score++;
                    }
                    room.leaderboard.set(studentId, existing);
                    broadcastLeaderboard(io, code);
                }
                socket.emit('vote:confirmed', { option, isCorrect: result.isCorrect ?? null });
                io.to(code).emit('poll:results_update', { results: result.results });
                broadcastStudentList(io, code);
                broadcastCanCreate(io, code);
                console.log(`Vote in ${code}: "${student.name}" -> "${option}" isCorrect=${result.isCorrect}`);
            }
            else {
                socket.emit('error', { message: result.message });
            }
        });
        // ─── Session Replay ────────────────────────────────────────────────────
        socket.on('session:replay', async ({ roomCode, pollId }) => {
            const code = roomCode.toUpperCase();
            const room = roomStates.get(code);
            if (!room || socket.id !== room.teacherSocketId) {
                socket.emit('error', { message: 'Unauthorized.' });
                return;
            }
            if (!canCreateNewPoll(code)) {
                socket.emit('error', { message: 'Cannot replay while a poll is active.' });
                return;
            }
            try {
                const poll = await PollService_1.default.replayPoll(code, pollId);
                await RoomService_1.default.addPollToRoom(code, poll._id.toString());
                room.connectedStudents.forEach((s) => {
                    s.votedInCurrentPoll = false;
                });
                io.to(code).emit('poll:started', { poll: poll.toObject(), remainingTime: poll.timer });
                io.to(`teacher:${code}`).emit('poll:can_create_update', { canCreate: false });
                broadcastStudentList(io, code);
                console.log(`Replaying poll in room ${code}: "${poll.question}"`);
            }
            catch (err) {
                socket.emit('error', { message: err instanceof Error ? err.message : 'Replay failed.' });
            }
        });
        // ─── Queue Poll ────────────────────────────────────────────────────────
        socket.on('poll:queue', ({ roomCode, question, type, options, timer, correctAnswer, isAnonymous, }) => {
            const code = roomCode.toUpperCase();
            const room = roomStates.get(code);
            if (!room || socket.id !== room.teacherSocketId) {
                socket.emit('error', { message: 'Unauthorized.' });
                return;
            }
            room.pollQueue.push({
                question,
                type: type,
                options,
                timer,
                correctAnswer: correctAnswer || undefined,
                isAnonymous: isAnonymous ?? false,
            });
            broadcastQueue(io, code);
            console.log(`Poll queued in room ${code}: "${question}" (queue: ${room.pollQueue.length})`);
        });
        // ─── Remove from Queue ─────────────────────────────────────────────────
        socket.on('poll:queue:remove', ({ roomCode, index }) => {
            const code = roomCode.toUpperCase();
            const room = roomStates.get(code);
            if (!room || socket.id !== room.teacherSocketId) {
                socket.emit('error', { message: 'Unauthorized.' });
                return;
            }
            if (index >= 0 && index < room.pollQueue.length) {
                room.pollQueue.splice(index, 1);
                broadcastQueue(io, code);
            }
        });
        // ─── Kick Student ──────────────────────────────────────────────────────
        socket.on('student:kick', ({ roomCode, studentSocketId }) => {
            const code = roomCode.toUpperCase();
            const room = roomStates.get(code);
            if (!room || socket.id !== room.teacherSocketId) {
                socket.emit('error', { message: 'Unauthorized.' });
                return;
            }
            const target = io.sockets.sockets.get(studentSocketId);
            const student = room.connectedStudents.get(studentSocketId);
            if (target && student) {
                target.emit('student:kicked', { message: 'You have been removed from the session.' });
                target.disconnect(true);
                console.log(`Kicked "${student.name}" from room ${code}`);
            }
            room.connectedStudents.delete(studentSocketId);
            broadcastStudentList(io, code);
            broadcastCanCreate(io, code);
        });
        // ─── Chat ──────────────────────────────────────────────────────────────
        socket.on('chat:send', async ({ roomCode, message, sender, role, }) => {
            if (!roomCode || !message?.trim())
                return;
            const chatMsg = await ChatService_1.default.saveMessage(sender, role, message.trim().slice(0, 500));
            io.to(roomCode.toUpperCase()).emit('chat:message', chatMsg);
        });
        // ─── Disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const roomCode = socketToRoom.get(socket.id);
            socketToRoom.delete(socket.id);
            if (!roomCode)
                return;
            const room = roomStates.get(roomCode);
            if (!room)
                return;
            if (room.connectedStudents.has(socket.id)) {
                const s = room.connectedStudents.get(socket.id);
                room.connectedStudents.delete(socket.id);
                console.log(`"${s?.name}" disconnected from room ${roomCode}`);
                broadcastStudentList(io, roomCode);
                broadcastCanCreate(io, roomCode);
            }
            if (room.teacherSocketId === socket.id) {
                room.teacherSocketId = null;
                console.log(`Teacher disconnected from room ${roomCode}`);
            }
        });
    });
}
//# sourceMappingURL=PollSocketHandler.js.map