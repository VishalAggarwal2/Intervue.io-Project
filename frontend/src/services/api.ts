import axios from 'axios';
import { PollData, PollTemplate, StudentReportEntry } from '../types';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: `${BASE_URL}/api`, timeout: 10000 });

// ── Rooms ──────────────────────────────────────────────────────────────────

export const createRoom = async (name?: string): Promise<{ roomCode: string; name: string }> => {
  const { data } = await api.post<{ success: boolean; data: { roomCode: string; name: string } }>(
    '/rooms',
    { name }
  );
  return data.data;
};

export const fetchRoom = async (roomCode: string) => {
  const { data } = await api.get(`/rooms/${roomCode}`);
  return data.data;
};

export const fetchPollHistory = async (roomCode: string): Promise<PollData[]> => {
  const { data } = await api.get<{ success: boolean; data: PollData[] }>(
    `/rooms/${roomCode}/history`
  );
  return data.data;
};

export const fetchStudentReport = async (roomCode: string): Promise<StudentReportEntry[]> => {
  const { data } = await api.get<{ success: boolean; data: StudentReportEntry[] }>(
    `/rooms/${roomCode}/report`
  );
  return data.data;
};

// ── Templates ──────────────────────────────────────────────────────────────

export const fetchTemplates = async (): Promise<PollTemplate[]> => {
  const { data } = await api.get<{ success: boolean; data: PollTemplate[] }>('/rooms/templates/all');
  return data.data;
};

export const saveTemplate = async (name: string, questions: PollTemplate['questions']): Promise<PollTemplate> => {
  const { data } = await api.post<{ success: boolean; data: PollTemplate }>('/rooms/templates', {
    name,
    questions,
  });
  return data.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/rooms/templates/${id}`);
};

// ── Export ─────────────────────────────────────────────────────────────────

export const downloadPollCSV = (pollId: string): void => {
  window.open(`${BASE_URL}/api/rooms/polls/${pollId}/export`, '_blank');
};
