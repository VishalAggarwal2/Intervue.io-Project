import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { SocketProvider, useSocketInstance } from './contexts/SocketContext';
import { AppProvider, useAppContext } from './contexts/AppContext';
import LandingPage from './pages/LandingPage';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import StudentDashboard from './components/Student/StudentDashboard';

// Apply saved theme on first render
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const TeacherRoomPage: React.FC = () => {
  const { roomCode = '' } = useParams<{ roomCode: string }>();
  const { socket } = useSocketInstance();
  const { dispatch } = useAppContext();

  useEffect(() => {
    dispatch({ type: 'SET_ROLE', payload: 'teacher' });
  }, [dispatch]);

  return <TeacherDashboard socket={socket} roomCode={roomCode.toUpperCase()} />;
};

const StudentRoomPage: React.FC = () => {
  const { roomCode = '' } = useParams<{ roomCode: string }>();
  const { socket } = useSocketInstance();
  const { dispatch } = useAppContext();

  useEffect(() => {
    dispatch({ type: 'SET_ROLE', payload: 'student' });
  }, [dispatch]);

  return <StudentDashboard socket={socket} roomCode={roomCode.toUpperCase()} />;
};

// /join/:roomCode redirects to /student/:roomCode
const JoinRedirect: React.FC = () => {
  const { roomCode = '' } = useParams<{ roomCode: string }>();
  return <Navigate to={`/student/${roomCode.toUpperCase()}`} replace />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <SocketProvider>
      <AppProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/teacher/:roomCode" element={<TeacherRoomPage />} />
          <Route path="/student/:roomCode" element={<StudentRoomPage />} />
          <Route path="/join/:roomCode" element={<JoinRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </SocketProvider>
  </BrowserRouter>
);

export default App;
