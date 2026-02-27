"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.saveTemplate = exports.getTemplates = exports.exportPollCSV = exports.getPollHistory = exports.getStudentReport = exports.getRoom = exports.createRoom = void 0;
const RoomService_1 = __importDefault(require("../services/RoomService"));
const PollService_1 = __importDefault(require("../services/PollService"));
const Template_1 = __importDefault(require("../models/Template"));
const Poll_1 = __importDefault(require("../models/Poll"));
// ── Rooms ──────────────────────────────────────────────────────────────────
const createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        const room = await RoomService_1.default.createRoom(name);
        res.json({ success: true, data: { roomCode: room.roomCode, name: room.name, _id: room._id } });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.createRoom = createRoom;
const getRoom = async (req, res) => {
    try {
        const room = await RoomService_1.default.getRoom(req.params.roomCode);
        if (!room) {
            res.status(404).json({ success: false, message: 'Room not found' });
            return;
        }
        res.json({ success: true, data: room });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.getRoom = getRoom;
const getStudentReport = async (req, res) => {
    try {
        const report = await RoomService_1.default.getStudentReport(req.params.roomCode);
        res.json({ success: true, data: report });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.getStudentReport = getStudentReport;
// ── Poll History & Export ──────────────────────────────────────────────────
const getPollHistory = async (req, res) => {
    try {
        const history = await PollService_1.default.getPollHistory(req.params.roomCode);
        res.json({ success: true, data: history });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.getPollHistory = getPollHistory;
const exportPollCSV = async (req, res) => {
    try {
        const poll = await Poll_1.default.findById(req.params.pollId).lean();
        if (!poll) {
            res.status(404).json({ success: false, message: 'Poll not found' });
            return;
        }
        const rows = [
            `"Question","${poll.question.replace(/"/g, '""')}"`,
            `"Type","${poll.type}"`,
            `"Total Votes","${poll.votes.length}"`,
            `"Timer","${poll.timer}s"`,
            poll.correctAnswer ? `"Correct Answer","${poll.correctAnswer}"` : '',
            '',
            '"Student Name","Answer","Correct","Score","Time"',
        ];
        for (const vote of poll.votes) {
            rows.push(`"${vote.studentName}","${vote.option}","${vote.isCorrect ?? 'N/A'}","${vote.score ?? 0}","${new Date(vote.votedAt).toISOString()}"`);
        }
        rows.push('', '"Option","Votes","Percentage"');
        for (const r of poll.results) {
            rows.push(`"${r.option}","${r.count}","${r.percentage}%"`);
        }
        const csv = rows.filter((r) => r !== '').join('\n');
        const filename = `poll-${poll._id}-${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.exportPollCSV = exportPollCSV;
// ── Templates ──────────────────────────────────────────────────────────────
const getTemplates = async (_req, res) => {
    try {
        const templates = await Template_1.default.find().sort({ createdAt: -1 });
        res.json({ success: true, data: templates });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.getTemplates = getTemplates;
const saveTemplate = async (req, res) => {
    try {
        const { name, questions } = req.body;
        if (!name || !questions?.length) {
            res.status(400).json({ success: false, message: 'Name and questions required' });
            return;
        }
        const template = new Template_1.default({ name, questions });
        await template.save();
        res.json({ success: true, data: template });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.saveTemplate = saveTemplate;
const deleteTemplate = async (req, res) => {
    try {
        await Template_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=RoomController.js.map