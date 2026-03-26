import express from 'express';
import { getStudentsByClass, createStudent } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:classId').get(protect, getStudentsByClass);
router.route('/').post(protect, createStudent);

export default router;
