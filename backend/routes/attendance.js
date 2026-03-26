import express from 'express';
import { startSession, scanAttendance, endSession, getReport, getActiveSession } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/active-session').get(protect, getActiveSession);
router.route('/start-session').post(protect, startSession);
router.route('/scan').post(protect, scanAttendance);
router.route('/end-session').post(protect, endSession);
router.route('/report/:sessionId').get(protect, getReport);

export default router;
