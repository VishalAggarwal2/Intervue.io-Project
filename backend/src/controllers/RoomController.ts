import { Request, Response } from 'express';
import roomService from '../services/RoomService';
import pollService from '../services/PollService';
import TemplateModel from '../models/Template';
import PollModel from '../models/Poll';

// ── Rooms ──────────────────────────────────────────────────────────────────

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const room = await roomService.createRoom(name);
    res.json({ success: true, data: { roomCode: room.roomCode, name: room.name, _id: room._id } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

export const getRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await roomService.getRoom(req.params.roomCode);
    if (!room) { res.status(404).json({ success: false, message: 'Room not found' }); return; }
    res.json({ success: true, data: room });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

export const getStudentReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await roomService.getStudentReport(req.params.roomCode);
    res.json({ success: true, data: report });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

// ── Poll History & Export ──────────────────────────────────────────────────

export const getPollHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const history = await pollService.getPollHistory(req.params.roomCode);
    res.json({ success: true, data: history });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

export const exportPollCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const poll = await PollModel.findById(req.params.pollId).lean();
    if (!poll) { res.status(404).json({ success: false, message: 'Poll not found' }); return; }

    const rows: string[] = [
      `"Question","${poll.question.replace(/"/g, '""')}"`,
      `"Type","${poll.type}"`,
      `"Total Votes","${poll.votes.length}"`,
      `"Timer","${poll.timer}s"`,
      poll.correctAnswer ? `"Correct Answer","${poll.correctAnswer}"` : '',
      '',
      '"Student Name","Answer","Correct","Score","Time"',
    ];

    for (const vote of poll.votes) {
      rows.push(
        `"${vote.studentName}","${vote.option}","${vote.isCorrect ?? 'N/A'}","${vote.score ?? 0}","${new Date(vote.votedAt).toISOString()}"`
      );
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
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

// ── Templates ──────────────────────────────────────────────────────────────

export const getTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await TemplateModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

export const saveTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, questions } = req.body;
    if (!name || !questions?.length) {
      res.status(400).json({ success: false, message: 'Name and questions required' });
      return;
    }
    const template = new TemplateModel({ name, questions });
    await template.save();
    res.json({ success: true, data: template });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};

export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    await TemplateModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Error' });
  }
};
