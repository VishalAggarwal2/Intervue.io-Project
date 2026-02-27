import React, { useState, useEffect } from 'react';
import { StudentReportEntry } from '../../types';
import { fetchStudentReport } from '../../services/api';

interface StudentReportProps {
  roomCode: string;
}

const StudentReport: React.FC<StudentReportProps> = ({ roomCode }) => {
  const [report, setReport] = useState<StudentReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchStudentReport(roomCode);
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomCode) loadReport();
  }, [roomCode]);

  return (
    <div className="card student-report-card">
      <div className="report-header">
        <h2 className="card-title">
          <span className="icon">📈</span> Student Report
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={loadReport} disabled={loading}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {report.length === 0 && !loading && (
        <div className="empty-state small">
          <p>No completed polls yet. Reports appear after polls end.</p>
        </div>
      )}

      {report.length > 0 && (
        <ul className="report-list">
          {report.map((entry) => (
            <li key={entry.studentId} className="report-item">
              <button
                className="report-item-header"
                onClick={() => setExpanded(expanded === entry.studentId ? null : entry.studentId)}
              >
                <div className="report-student-info">
                  <span className="student-avatar">
                    {entry.studentName.charAt(0).toUpperCase()}
                  </span>
                  <span className="report-name">{entry.studentName}</span>
                </div>
                <div className="report-summary">
                  <span className="report-score">{entry.score} pts</span>
                  <span className="report-accuracy">{entry.accuracy}% accuracy</span>
                  <span className="report-answered">
                    {entry.correctAnswers}/{entry.totalAnswered}
                  </span>
                  <span className="report-chevron">
                    {expanded === entry.studentId ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {expanded === entry.studentId && (
                <div className="report-details">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Answer</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.details.map((d, i) => (
                        <tr key={i} className={d.correct ? 'correct-row' : 'wrong-row'}>
                          <td>{d.question}</td>
                          <td>{d.option}</td>
                          <td>{d.correct ? '✓' : '✗'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StudentReport;
