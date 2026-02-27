import { Router } from 'express';
import {
  createRoom,
  getRoom,
  getStudentReport,
  getPollHistory,
  exportPollCSV,
  getTemplates,
  saveTemplate,
  deleteTemplate,
} from '../controllers/RoomController';

const router = Router();

// Rooms
router.post('/', createRoom);
router.get('/:roomCode', getRoom);
router.get('/:roomCode/history', getPollHistory);
router.get('/:roomCode/report', getStudentReport);

// Templates
router.get('/templates/all', getTemplates);
router.post('/templates', saveTemplate);
router.delete('/templates/:id', deleteTemplate);

// Export
router.get('/polls/:pollId/export', exportPollCSV);

export default router;
