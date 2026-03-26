import Teacher from '../models/Teacher.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authTeacher = async (req, res) => {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });

    if (teacher && (await teacher.matchPassword(password))) {
        res.json({
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            assignedClasses: teacher.assignedClasses,
            token: generateToken(teacher._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new teacher
// @route   POST /api/auth/register
// @access  Public
const registerTeacher = async (req, res) => {
    const { name, email, password, assignedClasses } = req.body;

    const teacherExists = await Teacher.findOne({ email });

    if (teacherExists) {
        res.status(400).json({ message: 'Teacher already exists' });
        return;
    }

    const teacher = await Teacher.create({
        name,
        email,
        password,
        assignedClasses
    });

    if (teacher) {
        res.status(201).json({
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            assignedClasses: teacher.assignedClasses,
            token: generateToken(teacher._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid teacher data' });
    }
};

export { authTeacher, registerTeacher };
