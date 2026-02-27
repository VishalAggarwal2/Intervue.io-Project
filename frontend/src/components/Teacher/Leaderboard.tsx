import React from 'react';
import { LeaderboardEntry } from '../../types';

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard }) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score);

  return (
    <div className="card leaderboard-card">
      <h2 className="card-title">
        <span className="icon">🏆</span> Leaderboard
        <span className="count-badge">{sorted.length}</span>
      </h2>

      {sorted.length === 0 ? (
        <div className="empty-state small">
          <p>No scores yet. Start a poll with a correct answer to track points!</p>
        </div>
      ) : (
        <ol className="leaderboard-list">
          {sorted.map((entry, index) => (
            <li
              key={entry.studentId}
              className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}
            >
              <span className="lb-rank">
                {index < 3 ? MEDALS[index] : `#${index + 1}`}
              </span>
              <span className="lb-name">{entry.studentName}</span>
              <div className="lb-stats">
                <span className="lb-score">{entry.score} pts</span>
                <span className="lb-detail">
                  {entry.correctAnswers}/{entry.totalAnswered} correct
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
