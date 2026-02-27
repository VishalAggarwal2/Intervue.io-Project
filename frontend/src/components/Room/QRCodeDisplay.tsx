import React, { useState } from 'react';
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  roomCode: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ roomCode }) => {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/student/${roomCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card qr-card">
      <h2 className="card-title">
        <span className="icon">📡</span> Room Code
      </h2>

      <div className="room-code-display">
        <span className="room-code-letters">{roomCode}</span>
      </div>

      <div className="qr-wrapper">
        <QRCode
          value={joinUrl}
          size={160}
          style={{ borderRadius: 8 }}
          fgColor="var(--text-primary)"
          bgColor="transparent"
        />
      </div>

      <p className="qr-url">{joinUrl}</p>

      <button className="btn btn-ghost btn-full" onClick={handleCopy}>
        {copied ? '✓ Copied!' : '📋 Copy Join Link'}
      </button>
    </div>
  );
};

export default QRCodeDisplay;
