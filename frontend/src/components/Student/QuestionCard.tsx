import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { PollData } from '../../types';
import Timer from '../Common/Timer';

interface QuestionCardProps {
  poll: PollData;
  socket: Socket | null;
  studentId: string;
  remainingTime: number;
  hasVoted: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ poll, socket, studentId, remainingTime, hasVoted }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    const answer = poll.type === 'openended' ? textAnswer.trim() : selectedOption;
    if (!answer || !socket || hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    socket.emit('poll:vote', { roomCode: poll.roomCode, pollId: poll._id, option: answer, studentId });
  };

  if (remainingTime <= 0 && !hasVoted) {
    return (
      <div className="card question-card">
        <div className="time-up-state">
          <span className="time-up-icon">⏰</span>
          <h2>Time's Up!</h2>
          <p>Waiting for results…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card question-card">
      <div className="question-header">
        <span className={`type-badge type-${poll.type}`}>{poll.type}</span>
        <Timer seconds={remainingTime} total={poll.timer} />
      </div>

      <h2 className="question-text">{poll.question}</h2>

      {/* MCQ */}
      {poll.type === 'mcq' && (
        <div className="options-grid">
          {poll.options.map((option, i) => (
            <button
              key={option}
              className={`option-btn ${selectedOption === option ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
              onClick={() => !hasVoted && setSelectedOption(option)}
              disabled={hasVoted}
            >
              <span className="option-letter-badge">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{option}</span>
              {selectedOption === option && <span className="option-check">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* True / False */}
      {poll.type === 'truefalse' && (
        <div className="tf-grid">
          {['True', 'False'].map((opt) => (
            <button
              key={opt}
              className={`tf-btn ${selectedOption === opt ? 'selected' : ''} ${hasVoted ? 'voted' : ''}`}
              onClick={() => !hasVoted && setSelectedOption(opt)}
              disabled={hasVoted}
            >
              {opt === 'True' ? '✅' : '❌'} {opt}
            </button>
          ))}
        </div>
      )}

      {/* Rating */}
      {poll.type === 'rating' && (
        <div className="rating-grid">
          {['1', '2', '3', '4', '5'].map((star) => (
            <button
              key={star}
              className={`star-btn ${selectedOption === star ? 'selected' : ''} ${Number(star) <= Number(selectedOption ?? 0) ? 'lit' : ''} ${hasVoted ? 'voted' : ''}`}
              onClick={() => !hasVoted && setSelectedOption(star)}
              disabled={hasVoted}
            >
              ⭐
              <span>{star}</span>
            </button>
          ))}
        </div>
      )}

      {/* Open-ended */}
      {poll.type === 'openended' && (
        <div className="openended-input">
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="form-input open-textarea"
            disabled={hasVoted}
            maxLength={500}
            rows={4}
          />
          <p className="char-count">{textAnswer.length}/500</p>
        </div>
      )}

      {!hasVoted && (
        <button
          className="btn btn-primary btn-full submit-vote-btn"
          onClick={handleSubmit}
          disabled={
            (!selectedOption && poll.type !== 'openended') ||
            (poll.type === 'openended' && !textAnswer.trim()) ||
            isSubmitting
          }
        >
          {isSubmitting ? 'Submitting…' : 'Submit Answer →'}
        </button>
      )}
    </div>
  );
};

export default QuestionCard;
