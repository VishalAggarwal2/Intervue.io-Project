import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../../types';

interface ChatPopupProps {
  socket: Socket | null;
  messages: ChatMessage[];
  sender: string;
  role: 'teacher' | 'student';
  roomCode: string;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ socket, messages, sender, role, roomCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  useEffect(() => {
    if (!isOpen && messages.length > prevLengthRef.current) {
      setUnread((u) => u + (messages.length - prevLengthRef.current));
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    socket.emit('chat:send', { roomCode, message: message.trim(), sender, role });
    setMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="chat-fab"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Toggle chat"
      >
        💬
        {unread > 0 && <span className="chat-badge">{unread}</span>}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Live Chat</h3>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">No messages yet. Say hello!</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.sender === sender ? 'own' : ''} ${msg.role}`}
              >
                <div className="chat-message-header">
                  <span className="chat-sender">
                    {msg.role === 'teacher' ? '👩‍🏫' : '👤'} {msg.sender}
                  </span>
                  <span className="chat-time">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="chat-text">{msg.message}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="chat-input"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!message.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatPopup;
