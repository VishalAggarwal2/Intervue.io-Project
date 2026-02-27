import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { PollData } from '../../types';
import ResultsChart from '../Common/ResultsChart';
import { downloadPollCSV } from '../../services/api';

interface PollHistoryProps {
  history: PollData[];
  socket: Socket | null;
  roomCode: string;
  canReplay: boolean;
}

const PollHistory: React.FC<PollHistoryProps> = ({ history, socket, roomCode, canReplay }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleReplay = (pollId: string) => {
    if (!socket || !canReplay) return;
    socket.emit('session:replay', { roomCode, pollId });
  };

  return (
    <div className="card poll-history-card">
      <h2 className="card-title">
        <span className="icon">📜</span> Poll History
        <span className="count-badge">{history.length}</span>
      </h2>

      {history.length === 0 ? (
        <div className="empty-state small">
          <p>No past polls yet.</p>
        </div>
      ) : (
        <ul className="history-list">
          {history.map((poll) => {
            const isExpanded = expandedId === poll._id;
            const totalVotes = poll.votes?.length ?? 0;

            return (
              <li key={poll._id} className="history-item">
                <button
                  className="history-item-header"
                  onClick={() => setExpandedId(isExpanded ? null : poll._id)}
                >
                  <div className="history-meta">
                    <span className="history-question">{poll.question}</span>
                    <span className="history-detail">
                      {formatDate(poll.createdAt)} · {totalVotes} votes · {poll.timer}s
                      <span className="type-badge">{poll.type}</span>
                    </span>
                  </div>
                  <span className="history-chevron">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="history-results">
                    {poll.correctAnswer && (
                      <div className="correct-answer-banner" style={{ marginBottom: 12 }}>
                        ✅ Correct Answer: <strong>{poll.correctAnswer}</strong>
                      </div>
                    )}
                    <ResultsChart
                      results={poll.results}
                      correctAnswer={poll.correctAnswer}
                      type={poll.type}
                    />
                    <div className="history-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleReplay(poll._id)}
                        disabled={!canReplay}
                        title={canReplay ? 'Replay this poll' : 'Finish current poll first'}
                      >
                        🔁 Replay
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => downloadPollCSV(poll._id)}
                      >
                        ⬇️ Export CSV
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PollHistory;
