import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Student from '../models/Student.js';

// @desc    Start an attendance session
// @route   POST /api/attendance/start-session
// @access  Private
const startSession = async (req, res) => {
    const { classId, subject } = req.body;

    // Check if there's already an active session for this teacher
    const activeSession = await AttendanceSession.findOne({
        teacherId: req.teacher._id,
        isActive: true
    });

    if (activeSession) {
        res.status(400).json({ message: 'You already have an active session' });
        return;
    }

    const session = await AttendanceSession.create({
        classId,
        subject,
        teacherId: req.teacher._id,
        isActive: true,
    });

    res.status(201).json(session);
};

// @desc    Scan and record attendance
// @route   POST /api/attendance/scan
// @access  Private
const scanAttendance = async (req, res) => {
    const { barcodeId, sessionId } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.isActive) {
        res.status(400).json({ message: 'Invalid or inactive session' });
        return;
    }

    let student = await Student.findOne({ barcodeId, classId: session.classId });
    if (!student) {
        // Auto-create unknown students so any barcode is accepted
        student = await Student.create({
            name: `New Student (${barcodeId})`,
            rollNo: `ID-${barcodeId}`,
            barcodeId: barcodeId,
            classId: session.classId
        });
    }

    const alreadyScanned = await AttendanceRecord.findOne({
        sessionId,
        studentId: student._id
    });

    if (alreadyScanned) {
        res.status(400).json({ message: 'Duplicate scan' });
        return;
    }

    const record = await AttendanceRecord.create({
        sessionId,
        studentId: student._id
    });

    res.status(201).json({
        message: 'Attendance marked',
        student,
        record
    });
};

// @desc    End an attendance session
// @route   POST /api/attendance/end-session
// @access  Private
const endSession = async (req, res) => {
    const { sessionId } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
        res.status(404).json({ message: 'Session not found' });
        return;
    }

    if (session.teacherId.toString() !== req.teacher._id.toString()) {
        res.status(401).json({ message: 'Not authorized to end this session' });
        return;
    }

    session.isActive = false;
    session.endTime = Date.now();
    await session.save();

    res.json({ message: 'Session ended successfully', session });
};

// @desc    Get attendance report
// @route   GET /api/attendance/report/:sessionId
// @access  Private
const getReport = async (req, res) => {
    const { sessionId } = req.params;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
        res.status(404).json({ message: 'Session not found' });
        return;
    }

    // Get all students in the class
    const allStudents = await Student.find({ classId: session.classId }).lean();
    
    // Get all records for this session
    const records = await AttendanceRecord.find({ sessionId }).populate('studentId').lean();
    
    // Extract present student IDs
    const presentStudentIds = records.map(r => r.studentId._id.toString());
    
    // Separate into present and absent
    const presentStudents = allStudents.filter(s => presentStudentIds.includes(s._id.toString()));
    const absentStudents = allStudents.filter(s => !presentStudentIds.includes(s._id.toString()));

    res.json({
        session,
        stats: {
            total: allStudents.length,
            present: presentStudents.length,
            absent: absentStudents.length
        },
        presentStudents,
        absentStudents
    });
};

// @desc    Get active session for teacher
// @route   GET /api/attendance/active-session
// @access  Private
const getActiveSession = async (req, res) => {
    const activeSession = await AttendanceSession.findOne({
        teacherId: req.teacher._id,
        isActive: true
    });
    res.json(activeSession || null);
};

export { startSession, scanAttendance, endSession, getReport, getActiveSession };
