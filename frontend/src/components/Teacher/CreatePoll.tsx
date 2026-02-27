import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { QuestionType, TemplateQuestion } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import TemplateManager from './TemplateManager';

interface CreatePollProps {
  socket: Socket | null;
  roomCode: string;
  canCreate: boolean;
  isActive: boolean;
}

const TIMER_OPTIONS = [
  { label: '30 seconds', value: 30 },
  { label: '60 seconds', value: 60 },
  { label: '90 seconds', value: 90 },
  { label: '2 minutes', value: 120 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 },
];

const RATING_OPTIONS = ['1', '2', '3', '4', '5'];

const CreatePoll: React.FC<CreatePollProps> = ({ socket, roomCode, canCreate, isActive }) => {
  const { state } = useAppContext();
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<QuestionType>('mcq');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [timer, setTimer] = useState(60);
  const [tab, setTab] = useState<'create' | 'templates'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const launchDisabled = isActive || !canCreate;
  const showOptions = type === 'mcq';
  const showCorrect = type === 'mcq' || type === 'truefalse';

  const validOptions =
    type === 'openended' ? [] :
    type === 'truefalse' ? ['True', 'False'] :
    type === 'rating' ? RATING_OPTIONS :
    options.map((o) => o.trim()).filter(Boolean);

  const formValid = !!question.trim() && (type !== 'mcq' || validOptions.length >= 2);

  const handleOptionChange = (i: number, v: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
    if (correctAnswer === options[i]?.trim() && v.trim() !== options[i]?.trim()) {
      setCorrectAnswer('');
    }
  };

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setCorrectAnswer('');
    setIsAnonymous(false);
    setTimer(60);
  };

  const loadTemplate = (q: TemplateQuestion) => {
    setQuestion(q.question);
    setType(q.type);
    if (q.type === 'mcq') setOptions(q.options.length >= 2 ? q.options : ['', '']);
    setCorrectAnswer(q.correctAnswer ?? '');
    setIsAnonymous(q.isAnonymous);
    setTimer(q.timer);
    setTab('create');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || launchDisabled || isSubmitting || !formValid) return;

    setIsSubmitting(true);
    socket.emit('poll:create', {
      roomCode,
      question: question.trim(),
      type,
      options: validOptions,
      timer,
      correctAnswer: showCorrect && correctAnswer ? correctAnswer : undefined,
      isAnonymous,
    });

    resetForm();
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleAddToQueue = () => {
    if (!socket || !formValid) return;
    socket.emit('poll:queue', {
      roomCode,
      question: question.trim(),
      type,
      options: validOptions,
      timer,
      correctAnswer: showCorrect && correctAnswer ? correctAnswer : undefined,
      isAnonymous,
    });
    resetForm();
  };

  return (
    <div className="tv-create-card">
      {/* Badge + Heading */}
      <div className="tv-create-top">
        <span className="tv-badge">✦ Intervue Poll</span>
        <h1 className="tv-create-heading">
          Let's <strong>Get Started</strong>
        </h1>
        <p className="tv-create-sub">
          You'll have the ability to create and manage polls, ask questions, and monitor
          your students' responses in real-time.
        </p>
      </div>

      {/* Tabs */}
      <div className="tv-form-tabs">
        <button
          className={`tv-form-tab ${tab === 'create' ? 'active' : ''}`}
          onClick={() => setTab('create')}
        >Create</button>
        <button
          className={`tv-form-tab ${tab === 'templates' ? 'active' : ''}`}
          onClick={() => setTab('templates')}
        >Templates</button>
      </div>

      {tab === 'templates' && (
        <div className="tv-template-wrapper">
          <TemplateManager onLoad={loadTemplate} />
        </div>
      )}

      {tab === 'create' && (
        <>
          <form onSubmit={handleSubmit} className="tv-poll-form">
            <div className="tv-divider" />

            {/* Question row */}
            <div className="tv-question-row">
              <div className="tv-question-field">
                <label className="tv-label">Enter your question</label>
                <div className="tv-textarea-wrap">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="tv-textarea"
                    maxLength={300}
                    rows={3}
                  />
                  <span className="tv-char-count">{question.length}/300</span>
                </div>
              </div>
              <div className="tv-timer-field">
                <label className="tv-label">Time limit</label>
                <select
                  value={timer}
                  onChange={(e) => setTimer(Number(e.target.value))}
                  className="tv-timer-select"
                >
                  {TIMER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question type */}
            <div className="tv-type-row">
              <label className="tv-label">Question type</label>
              <div className="tv-type-pills">
                {(['mcq', 'truefalse', 'rating', 'openended'] as QuestionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tv-type-pill ${type === t ? 'active' : ''}`}
                    onClick={() => { setType(t); setCorrectAnswer(''); }}
                  >
                    {t === 'mcq' ? 'Multiple Choice' : t === 'truefalse' ? 'True / False' : t === 'rating' ? 'Rating' : 'Open Ended'}
                  </button>
                ))}
              </div>
            </div>

            {/* MCQ Options */}
            {showOptions && (
              <div className="tv-options-section">
                <div className="tv-options-header">
                  <span className="tv-label">Edit Options</span>
                  {showCorrect && <span className="tv-label tv-correct-col-label">Is it Correct?</span>}
                </div>
                <div className="tv-options-list">
                  {options.map((opt, i) => {
                    const optVal = opt.trim();
                    const isCorrect = !!optVal && correctAnswer === optVal;
                    return (
                      <div key={i} className={`tv-edit-option-row ${isCorrect ? 'is-correct' : ''}`}>
                        <span className="tv-opt-num">{i + 1}</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="tv-opt-input"
                          maxLength={100}
                        />
                        {showCorrect && (
                          <div className="tv-correct-radios">
                            <label className="tv-radio-label">
                              <input
                                type="radio"
                                checked={isCorrect}
                                onChange={() => optVal && setCorrectAnswer(optVal)}
                                disabled={!optVal}
                              />
                              Yes
                            </label>
                            <label className="tv-radio-label">
                              <input
                                type="radio"
                                checked={!isCorrect}
                                onChange={() => { if (isCorrect) setCorrectAnswer(''); }}
                              />
                              No
                            </label>
                          </div>
                        )}
                        {options.length > 2 && (
                          <button
                            type="button"
                            className="tv-remove-opt"
                            onClick={() => {
                              if (correctAnswer === opt.trim()) setCorrectAnswer('');
                              setOptions((o) => o.filter((_, idx) => idx !== i));
                            }}
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setOptions((o) => [...o, ''])}
                    className="tv-add-option-btn"
                  >+ Add More option</button>
                )}
              </div>
            )}

            {/* True/False correct answer */}
            {type === 'truefalse' && (
              <div className="tv-options-section">
                <div className="tv-options-header">
                  <span className="tv-label">Options</span>
                  <span className="tv-label tv-correct-col-label">Is it Correct?</span>
                </div>
                <div className="tv-options-list">
                  {['True', 'False'].map((opt) => {
                    const isCorrect = correctAnswer === opt;
                    return (
                      <div key={opt} className={`tv-edit-option-row ${isCorrect ? 'is-correct' : ''}`}>
                        <span className="tv-opt-num">{opt === 'True' ? 1 : 2}</span>
                        <span className="tv-opt-static">{opt}</span>
                        <div className="tv-correct-radios">
                          <label className="tv-radio-label">
                            <input
                              type="radio"
                              checked={isCorrect}
                              onChange={() => setCorrectAnswer(opt)}
                            />
                            Yes
                          </label>
                          <label className="tv-radio-label">
                            <input
                              type="radio"
                              checked={!isCorrect}
                              onChange={() => { if (isCorrect) setCorrectAnswer(''); }}
                            />
                            No
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Anonymous toggle */}
            <div className="tv-anon-row">
              <label className="tv-radio-label" style={{ fontSize: '0.85rem', color: 'var(--tv-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Anonymous voting
              </label>
            </div>

            <div className="tv-divider" />

            {/* Actions */}
            <div className="tv-form-actions">
              <button
                type="button"
                className="tv-queue-btn"
                disabled={!formValid}
                onClick={handleAddToQueue}
              >
                + Add to Queue
              </button>
              <button
                type="submit"
                className="tv-ask-btn"
                disabled={launchDisabled || !formValid || isSubmitting}
              >
                {isSubmitting ? 'Launching…' : 'Ask Question'}
              </button>
            </div>
          </form>

        </>
      )}
    </div>
  );
};

export default CreatePoll;
