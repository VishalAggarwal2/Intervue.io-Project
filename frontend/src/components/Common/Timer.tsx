import React from 'react';

interface TimerProps {
  seconds: number;
  total: number;
}

const Timer: React.FC<TimerProps> = ({ seconds, total }) => {
  const percentage = total > 0 ? (seconds / total) * 100 : 0;
  const isUrgent = seconds <= 10;
  const isCritical = seconds <= 5;

  const circumference = 2 * Math.PI * 40;
  const strokeDash = (percentage / 100) * circumference;

  return (
    <div className="timer-wrapper">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={isCritical ? 'var(--error)' : isUrgent ? 'var(--warning)' : 'var(--accent)'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s ease' }}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill={isCritical ? 'var(--error)' : isUrgent ? 'var(--warning)' : 'var(--text-primary)'}
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--font-mono)"
        >
          {seconds}
        </text>
      </svg>
      <p className={`timer-label ${isCritical ? 'critical' : isUrgent ? 'urgent' : ''}`}>
        {isCritical ? 'Time almost up!' : isUrgent ? 'Hurry up!' : 'seconds left'}
      </p>
    </div>
  );
};

export default Timer;
