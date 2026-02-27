"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RoomController_1 = require("../controllers/RoomController");
const router = (0, express_1.Router)();
// Rooms
router.post('/', RoomController_1.createRoom);
router.get('/:roomCode', RoomController_1.getRoom);
router.get('/:roomCode/history', RoomController_1.getPollHistory);
router.get('/:roomCode/report', RoomController_1.getStudentReport);
// Templates
router.get('/templates/all', RoomController_1.getTemplates);
router.post('/templates', RoomController_1.saveTemplate);
router.delete('/templates/:id', RoomController_1.deleteTemplate);
// Export
router.get('/polls/:pollId/export', RoomController_1.exportPollCSV);
exports.default = router;
//# sourceMappingURL=roomRoutes.js.map