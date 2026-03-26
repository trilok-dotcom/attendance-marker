import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from './models/Teacher.js';
import Student from './models/Student.js';

dotenv.config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await Teacher.deleteMany();
        await Student.deleteMany();

        const teacher = await Teacher.create({
            name: 'John Doe',
            email: 'teacher@test.com',
            password: 'password123',
            assignedClasses: ['CS101', 'CS201']
        });

        console.log('Teacher created:', teacher.email);

        const students = await Student.insertMany([
            { name: 'Alice Smith', rollNo: 'CS001', barcodeId: '12345', classId: 'CS101' },
            { name: 'Bob Jones', rollNo: 'CS002', barcodeId: '23456', classId: 'CS101' },
            { name: 'Charlie Brown', rollNo: 'CS003', barcodeId: '34567', classId: 'CS101' },
        ]);

        console.log('Students created:', students.length);

        console.log('Seeding complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
