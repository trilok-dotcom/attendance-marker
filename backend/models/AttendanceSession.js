import mongoose from 'mongoose';

const attendanceSessionSchema = mongoose.Schema({
    classId: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Teacher',
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

export default AttendanceSession;
