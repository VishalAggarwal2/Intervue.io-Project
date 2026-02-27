import React from 'react';
import { PollData, PollResult, PollStatus, Student } from '../../types';

interface TeacherLiveViewProps {
  activePoll: PollData | null;
  results: PollResult[];
  remainingTime: number;
  pollStatus: PollStatus;
  students: Student[];
  canCreatePoll: boolean;
  onAskNew: () => void;
}

const TeacherLiveView: React.FC<TeacherLiveViewProps> = ({
  activePoll,
  results,
  remainingTime,
  pollStatus,
  students,
  canCreatePoll,
  onAskNew,
}) => {
  const totalVotes = results.reduce((s, r) => s + r.count, 0);
  const votedCount = students.filter((s) => s.votedInCurrentPoll).length;

  const isUrgent = remainingTime <= 10 && pollStatus === 'active';
  const isCritical = remainingTime <= 5 && pollStatus === 'active';

  const responsePct = students.length > 0 ? Math.round((votedCount / students.length) * 100) : 0;

  return (
    <div className="tv-live-view">
      {/* Question header */}
      <div className="tv-live-top">
        <div className="tv-live-meta">
          <span className="tv-live-label">Question</span>
          <div className="tv-live-stats">
            <span className="tv-response-count">{votedCount}/{students.length} responded</span>
            {pollStatus === 'active' && (
              <span className={`tv-timer-chip ${isCritical ? 'critical' : isUrgent ? 'urgent' : ''}`}>
                {remainingTime}s
              </span>
            )}
            {pollStatus === 'ended' && (
              <span className="tv-ended-chip">Ended</span>
            )}
          </div>
        </div>

        {/* Response progress bar */}
        {students.length > 0 && (
          <div className="tv-response-progress">
            <div className="tv-response-progress-fill" style={{ width: `${responsePct}%` }} />
          </div>
        )}

        {/* Question bar */}
        <div className="tv-question-bar">
          {activePoll?.question ?? 'No question'}
        </div>
      </div>

      {/* Correct answer banner */}
      {pollStatus === 'ended' && activePoll?.correctAnswer && (
        <div className="tv-correct-banner">
          Correct Answer: <strong>{activePoll.correctAnswer}</strong>
        </div>
      )}

      {/* Options with results */}
      {activePoll && activePoll.type !== 'openended' && (
        <div className="tv-results-list">
          {results.map((result, i) => {
            const isCorrect = activePoll.correctAnswer === result.option;
            const pct = result.percentage;

            return (
              <div
                key={result.option}
                className={`tv-result-row ${isCorrect && pollStatus === 'ended' ? 'correct' : ''}`}
              >
                <span className="tv-result-num">{i + 1}</span>
                <div className="tv-result-content">
                  <div className="tv-result-top">
                    <span className="tv-result-option">{result.option}</span>
                    <span className="tv-result-pct">{pct}%</span>
                  </div>
                  <div className="tv-result-track">
                    <div
                      className={`tv-result-fill ${isCorrect && pollStatus === 'ended' ? 'correct' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="tv-result-votes">{result.count} vote{result.count !== 1 ? 's' : ''}</span>
                </div>
                {isCorrect && pollStatus === 'ended' && (
                  <span className="tv-correct-tag">Correct</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Open-ended responses */}
      {activePoll?.type === 'openended' && (
        <div className="tv-openended-list">
          {results.flatMap((r) => r.textResponses ?? []).map((resp, i) => (
            <div key={i} className="tv-response-item">{resp}</div>
          ))}
          {totalVotes === 0 && <p className="tv-empty-note">No responses yet…</p>}
        </div>
      )}

      {/* Total votes */}
      {totalVotes > 0 && (
        <p className="tv-total-votes">{totalVotes} total response{totalVotes !== 1 ? 's' : ''}</p>
      )}

      {/* Ask new question button */}
      {canCreatePoll && pollStatus === 'ended' && (
        <div className="tv-ask-new-wrap">
          <button className="tv-ask-new-btn" onClick={onAskNew}>
            + Ask a new question
          </button>
        </div>
      )}

      {pollStatus === 'active' && students.length > 0 && (
        <div className="tv-waiting-students">
          {students.filter((s) => !s.votedInCurrentPoll).map((s) => (
            <span key={s.socketId} className="tv-waiting-chip">{s.name}</span>
          ))}
          {students.filter((s) => !s.votedInCurrentPoll).length === 0 && (
            <span className="tv-all-voted">All students have answered!</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherLiveView;
