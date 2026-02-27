import RoomModel, { IRoom } from '../models/Room';
import PollModel from '../models/Poll';

function generateRoomCode(): string {
  // Unambiguous characters only
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

class RoomService {
  async createRoom(name?: string): Promise<IRoom> {
    let roomCode: string;
    let attempts = 0;

    // Ensure uniqueness
    do {
      roomCode = generateRoomCode();
      attempts++;
      if (attempts > 20) throw new Error('Failed to generate unique room code');
    } while (await RoomModel.exists({ roomCode }));

    const room = new RoomModel({ roomCode, name: name || 'Untitled Room' });
    await room.save();
    return room;
  }

  async getRoom(roomCode: string): Promise<IRoom | null> {
    return RoomModel.findOne({ roomCode: roomCode.toUpperCase() });
  }

  async getRoomWithPolls(roomCode: string) {
    return RoomModel.findOne({ roomCode: roomCode.toUpperCase() }).populate('polls');
  }

  async addPollToRoom(roomCode: string, pollId: string): Promise<void> {
    await RoomModel.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase() },
      { $push: { polls: pollId } }
    );
  }

  async closeRoom(roomCode: string): Promise<void> {
    await RoomModel.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase() },
      { status: 'closed' }
    );
  }

  /**
   * Returns per-student analytics for all polls in the room.
   */
  async getStudentReport(roomCode: string) {
    const polls = await PollModel.find({
      roomCode: roomCode.toUpperCase(),
      status: 'completed',
    }).lean();

    const studentMap = new Map<
      string,
      { name: string; answered: number; correct: number; score: number; polls: { question: string; option: string; correct: boolean }[] }
    >();

    for (const poll of polls) {
      for (const vote of poll.votes) {
        if (!studentMap.has(vote.studentId)) {
          studentMap.set(vote.studentId, {
            name: vote.studentName,
            answered: 0,
            correct: 0,
            score: 0,
            polls: [],
          });
        }
        const entry = studentMap.get(vote.studentId)!;
        entry.answered++;
        const isCorrect = vote.isCorrect ?? false;
        if (isCorrect) {
          entry.correct++;
          entry.score += vote.score ?? 0;
        }
        entry.polls.push({
          question: poll.question,
          option: vote.option,
          correct: isCorrect,
        });
      }
    }

    return Array.from(studentMap.entries()).map(([studentId, data]) => ({
      studentId,
      studentName: data.name,
      totalAnswered: data.answered,
      correctAnswers: data.correct,
      score: data.score,
      accuracy: data.answered > 0 ? Math.round((data.correct / data.answered) * 100) : 0,
      details: data.polls,
    }));
  }
}

export default new RoomService();
