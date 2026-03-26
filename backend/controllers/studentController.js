import Student from '../models/Student.js';

// @desc    Get all students in a class
// @route   GET /api/students/:classId
// @access  Private
const getStudentsByClass = async (req, res) => {
    const students = await Student.find({ classId: req.params.classId });
    res.json(students);
};

// @desc    Create a student (admin/testing)
// @route   POST /api/students
// @access  Private
const createStudent = async (req, res) => {
    const { name, rollNo, barcodeId, classId } = req.body;

    const studentExists = await Student.findOne({ rollNo });

    if (studentExists) {
        res.status(400).json({ message: 'Student already exists' });
        return;
    }

    const student = await Student.create({
        name,
        rollNo,
        barcodeId,
        classId
    });

    if (student) {
        res.status(201).json(student);
    } else {
        res.status(400).json({ message: 'Invalid student data' });
    }
};

export { getStudentsByClass, createStudent };
