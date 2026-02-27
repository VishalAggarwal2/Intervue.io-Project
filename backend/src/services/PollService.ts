import { EventEmitter } from 'events';
import PollModel, { IPoll } from '../models/Poll';
import { PollResult, QuestionType } from '../types';

class PollService extends EventEmitter {
  // Room-scoped state maps
  private activePollByRoom = new Map<string, IPoll>();
  private pollTimerByRoom = new Map<string, NodeJS.Timeout>();

  /** Restore active polls from DB on server startup */
  async initialize(): Promise<void> {
    console.log('Restoring poll state from database...');
    const polls = await PollModel.find({ status: 'active' });

    if (polls.length === 0) {
      console.log('No active polls found in database.');
      return;
    }

    for (const poll of polls) {
      const roomCode = poll.roomCode;
      this.activePollByRoom.set(roomCode, poll);
      const remaining = this.getRemainingTime(roomCode);

      if (remaining > 0) {
        console.log(`Restored poll in room ${roomCode}. ${remaining}s remaining.`);
        this.scheduleTimer(roomCode, remaining);
      } else {
        console.log(`Poll in room ${roomCode} expired during downtime. Ending.`);
        const results = await this.endPoll(roomCode);
        this.emit('poll:ended', { roomCode, results, correctAnswer: poll.correctAnswer });
      }
    }
  }

  async createPoll(
    roomCode: string,
    question: string,
    type: QuestionType,
    options: string[],
    timer: number,
    correctAnswer?: string,
    isAnonymous = false
  ): Promise<IPoll> {
    if (this.activePollByRoom.has(roomCode)) {
      throw new Error('An active poll already exists in this room.');
    }

    // For open-ended, options can be empty; for others, require at least 2
    const pollOptions = type === 'openended' ? [] : options;
    const results =
      type === 'openended'
        ? [{ option: 'responses', count: 0, percentage: 0, textResponses: [] }]
        : pollOptions.map((opt) => ({ option: opt, count: 0, percentage: 0 }));

    const poll = new PollModel({
      question,
      type,
      options: pollOptions,
      correctAnswer: correctAnswer || undefined,
      isAnonymous,
      timer,
      roomCode: roomCode.toUpperCase(),
      startTime: new Date(),
      status: 'active',
      votes: [],
      results,
    });

    await poll.save();
    this.activePollByRoom.set(roomCode, poll);
    this.scheduleTimer(roomCode, timer);

    return poll;
  }

  getActivePoll(roomCode: string): IPoll | null {
    return this.activePollByRoom.get(roomCode) ?? null;
  }

  getRemainingTime(roomCode: string): number {
    const poll = this.activePollByRoom.get(roomCode);
    if (!poll) return 0;
    const elapsed = Math.floor((Date.now() - poll.startTime.getTime()) / 1000);
    return Math.max(0, poll.timer - elapsed);
  }

  async submitVote(
    roomCode: string,
    pollId: string,
    studentId: string,
    studentName: string,
    option: string
  ): Promise<{ success: boolean; results: PollResult[]; isCorrect?: boolean; message?: string }> {
    const activePoll = this.activePollByRoom.get(roomCode);

    if (!activePoll || activePoll._id.toString() !== pollId) {
      return { success: false, results: [], message: 'No active poll or poll ID mismatch.' };
    }

    // For non-open-ended, validate option
    if (activePoll.type !== 'openended' && !activePoll.options.includes(option)) {
      return { success: false, results: this.getResults(roomCode), message: 'Invalid option.' };
    }

    const isCorrect =
      activePoll.correctAnswer !== undefined && activePoll.correctAnswer !== ''
        ? option === activePoll.correctAnswer
        : undefined;

    const score = isCorrect ? 1 : 0;
    const voterName = activePoll.isAnonymous ? 'Anonymous' : studentName;

    // Atomic insert — prevents race conditions / double votes
    const updated = await PollModel.findOneAndUpdate(
      {
        _id: pollId,
        status: 'active',
        'votes.studentId': { $ne: studentId },
      },
      {
        $push: {
          votes: {
            studentId,
            studentName: voterName,
            option,
            votedAt: new Date(),
            isCorrect,
            score,
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return {
        success: false,
        results: this.getResults(roomCode),
        message: 'You have already voted or the poll has ended.',
      };
    }

    const results = this.recalculateResults(updated);
    await PollModel.findByIdAndUpdate(pollId, { results });

    updated.results = results as typeof updated.results;
    this.activePollByRoom.set(roomCode, updated);

    return { success: true, results, isCorrect };
  }

  async endPoll(roomCode: string): Promise<PollResult[]> {
    const poll = this.activePollByRoom.get(roomCode);
    if (!poll) return [];

    const timer = this.pollTimerByRoom.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.pollTimerByRoom.delete(roomCode);
    }

    const finalResults = this.getResults(roomCode);
    await PollModel.findByIdAndUpdate(poll._id, {
      status: 'completed',
      endTime: new Date(),
    });

    this.activePollByRoom.delete(roomCode);
    return finalResults;
  }

  async getPollHistory(roomCode: string): Promise<IPoll[]> {
    return PollModel.find({
      roomCode: roomCode.toUpperCase(),
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }

  /** Replay a past poll — creates a fresh poll with same config */
  async replayPoll(roomCode: string, pollId: string): Promise<IPoll> {
    const original = await PollModel.findById(pollId).lean();
    if (!original) throw new Error('Poll not found.');

    return this.createPoll(
      roomCode,
      original.question,
      original.type,
      original.options,
      original.timer,
      original.correctAnswer,
      original.isAnonymous
    );
  }

  private getResults(roomCode: string): PollResult[] {
    const poll = this.activePollByRoom.get(roomCode);
    if (!poll) return [];
    return poll.results.map((r) => ({
      option: r.option,
      count: r.count,
      percentage: r.percentage,
      textResponses: r.textResponses,
    }));
  }

  private recalculateResults(poll: IPoll): PollResult[] {
    const totalVotes = poll.votes.length;

    if (poll.type === 'openended') {
      const responses = poll.votes.map((v) => v.option);
      return [
        {
          option: 'responses',
          count: totalVotes,
          percentage: 100,
          textResponses: responses,
        },
      ];
    }

    return poll.options.map((opt) => {
      const count = poll.votes.filter((v) => v.option === opt).length;
      return {
        option: opt,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });
  }

  private scheduleTimer(roomCode: string, duration: number): void {
    const existing = this.pollTimerByRoom.get(roomCode);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(async () => {
      const poll = this.activePollByRoom.get(roomCode);
      const correctAnswer = poll?.correctAnswer;
      const results = await this.endPoll(roomCode);
      this.emit('poll:ended', { roomCode, results, correctAnswer });
    }, duration * 1000);

    this.pollTimerByRoom.set(roomCode, timeout);
  }
}

export default new PollService();
