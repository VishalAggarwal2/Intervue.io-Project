import React from 'react';
import { PollData, PollResult, PollStatus } from '../../types';
import ResultsChart from '../Common/ResultsChart';
import Timer from '../Common/Timer';

interface LiveResultsProps {
  activePoll: PollData | null;
  results: PollResult[];
  remainingTime: number;
  pollStatus: PollStatus;
}

const LiveResults: React.FC<LiveResultsProps> = ({ activePoll, results, remainingTime, pollStatus }) => {
  if (!activePoll && pollStatus === 'idle') {
    return (
      <div className="card live-results-empty">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>No Active Poll</h3>
          <p>Create a poll to see live results here.</p>
        </div>
      </div>
    );
  }

  const totalVotes = results.reduce((s, r) => s + r.count, 0);

  return (
    <div className="card live-results-card">
      <div className="live-results-header">
        <h2 className="card-title">
          <span className="icon">📊</span> Live Results
          {pollStatus === 'active' && <span className="live-badge">● LIVE</span>}
        </h2>
        {pollStatus === 'active' && <Timer seconds={remainingTime} total={activePoll?.timer ?? 60} />}
        {pollStatus === 'ended' && <span className="ended-badge">Poll Ended</span>}
      </div>

      {activePoll && (
        <>
          {activePoll.type !== 'openended' && activePoll.type !== 'rating' && activePoll.correctAnswer && pollStatus === 'ended' && (
            <div className="correct-answer-banner">
              ✅ Correct Answer: <strong>{activePoll.correctAnswer}</strong>
            </div>
          )}

          <p className="active-question">"{activePoll.question}"</p>

          <div className="vote-count-row">
            <span className="vote-count">{totalVotes} response{totalVotes !== 1 ? 's' : ''}</span>
            {activePoll.isAnonymous && <span className="anon-badge">🔒 Anonymous</span>}
            {pollStatus === 'active' && <span className="vote-watching">Watching in real-time…</span>}
          </div>

          <ResultsChart
            results={results}
            correctAnswer={pollStatus === 'ended' ? activePoll.correctAnswer : undefined}
            type={activePoll.type}
          />
        </>
      )}
    </div>
  );
};

export default LiveResults;
