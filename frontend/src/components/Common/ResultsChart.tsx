import React from 'react';
import { PollResult, QuestionType } from '../../types';

interface ResultsChartProps {
  results: PollResult[];
  highlightOption?: string | null;
  correctAnswer?: string;
  type?: QuestionType;
}

const COLORS = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--error)', '#a855f7', '#f97316'];

const ResultsChart: React.FC<ResultsChartProps> = ({
  results,
  highlightOption,
  correctAnswer,
  type = 'mcq',
}) => {
  if (!results.length) return <div className="results-empty"><p>No votes yet</p></div>;

  // Open-ended: show text responses list
  if (type === 'openended') {
    const allResponses = results.flatMap((r) => r.textResponses ?? [r.option]).filter(Boolean);
    return (
      <div className="openended-results">
        <p className="results-total">{allResponses.length} response{allResponses.length !== 1 ? 's' : ''}</p>
        <ul className="response-list">
          {allResponses.map((resp, i) => (
            <li key={i} className="response-item">💬 {resp}</li>
          ))}
        </ul>
      </div>
    );
  }

  const totalVotes = results.reduce((s, r) => s + r.count, 0);

  return (
    <div className="results-chart">
      {results.map((result, index) => {
        const isHighlighted = highlightOption === result.option;
        const isCorrect = correctAnswer === result.option;
        const color = isCorrect ? 'var(--success)' : COLORS[index % COLORS.length];

        return (
          <div
            key={result.option}
            className={`result-bar-row ${isHighlighted ? 'highlighted' : ''} ${isCorrect ? 'correct-bar' : ''}`}
          >
            <div className="result-bar-label">
              <span className="result-option">
                {isCorrect && <span className="correct-badge">✓ Correct</span>}
                {isHighlighted && !isCorrect && <span className="voted-badge">✓ Your vote</span>}
                {result.option}
              </span>
              <span className="result-stats">
                {result.count} vote{result.count !== 1 ? 's' : ''} · {result.percentage}%
              </span>
            </div>
            <div className="result-bar-track">
              <div
                className="result-bar-fill"
                style={{
                  width: `${result.percentage}%`,
                  background: isHighlighted || isCorrect
                    ? `linear-gradient(90deg, ${color}, ${color}cc)`
                    : `linear-gradient(90deg, ${color}99, ${color}66)`,
                  boxShadow: isCorrect ? `0 0 12px var(--success)66` : isHighlighted ? `0 0 12px ${color}66` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
      <p className="results-total">Total responses: <strong>{totalVotes}</strong></p>
    </div>
  );
};

export default ResultsChart;
