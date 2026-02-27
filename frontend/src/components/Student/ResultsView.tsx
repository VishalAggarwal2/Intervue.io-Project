import React from 'react';
import { PollData, PollResult, LeaderboardEntry } from '../../types';
import ResultsChart from '../Common/ResultsChart';

interface ResultsViewProps {
  poll: PollData | null;
  results: PollResult[];
  votedOption: string | null;
  isCorrect: boolean | null;
  pollEnded: boolean;
  leaderboard: LeaderboardEntry[];
  studentId: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  poll, results, votedOption, isCorrect, pollEnded, leaderboard, studentId,
}) => {
  const myRank = leaderboard.findIndex((e) => e.studentId === studentId) + 1;
  const myEntry = leaderboard.find((e) => e.studentId === studentId);

  return (
    <div className="card results-view-card">
      <div className="results-header">
        <h2 className="card-title">
          {pollEnded ? '🏁 Final Results' : '📊 Live Results'}
        </h2>
      </div>

      {poll && <p className="results-question">"{poll.question}"</p>}

      {/* Vote feedback */}
      {votedOption && (
        <div className={`vote-feedback ${isCorrect === true ? 'correct' : isCorrect === false ? 'wrong' : 'neutral'}`}>
          {isCorrect === true && <span>🎉 Correct! +1 point</span>}
          {isCorrect === false && <span>✗ Wrong — better luck next time!</span>}
          {isCorrect === null && <span>✅ Voted: <strong>{votedOption}</strong></span>}
        </div>
      )}

      <ResultsChart
        results={results}
        highlightOption={votedOption}
        correctAnswer={pollEnded ? poll?.correctAnswer : undefined}
        type={poll?.type}
      />

      {/* Leaderboard snippet */}
      {leaderboard.length > 0 && myEntry && (
        <div className="my-rank-card">
          <span>🏅 Your rank: <strong>#{myRank}</strong></span>
          <span>{myEntry.score} pts · {myEntry.correctAnswers}/{myEntry.totalAnswered} correct</span>
        </div>
      )}

      {pollEnded && <p className="poll-ended-note">Waiting for the next question…</p>}
      {!pollEnded && <p className="live-note">Results update live as votes come in.</p>}
    </div>
  );
};

export default ResultsView;
