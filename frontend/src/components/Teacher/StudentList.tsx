import React from 'react';
import { Socket } from 'socket.io-client';
import { Student } from '../../types';

interface StudentListProps {
  students: Student[];
  socket: Socket | null;
  roomCode: string;
}

const StudentList: React.FC<StudentListProps> = ({ students, socket, roomCode }) => {
  const handleKick = (studentSocketId: string, name: string) => {
    if (!socket) return;
    if (window.confirm(`Remove "${name}" from the session?`)) {
      socket.emit('student:kick', { roomCode: roomCode.toUpperCase(), studentSocketId });
    }
  };

  return (
    <div className="card student-list-card">
      <h2 className="card-title">
        <span className="icon">👥</span> Students
        <span className="count-badge">{students.length}</span>
      </h2>

      {students.length === 0 ? (
        <div className="empty-state small">
          <p>No students connected yet.</p>
          <p className="muted">Share the QR code or room code.</p>
        </div>
      ) : (
        <ul className="student-list">
          {students.map((student) => (
            <li key={student.socketId} className="student-item">
              <div className="student-info">
                <span className="student-avatar">{student.name.charAt(0).toUpperCase()}</span>
                <span className="student-name">{student.name}</span>
              </div>
              <div className="student-actions">
                <span className={`student-status ${student.votedInCurrentPoll ? 'voted' : 'waiting'}`}>
                  {student.votedInCurrentPoll ? '✓ Voted' : '⏳ Waiting'}
                </span>
                <button
                  className="btn btn-ghost btn-sm kick-btn"
                  onClick={() => handleKick(student.socketId, student.name)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentList;
