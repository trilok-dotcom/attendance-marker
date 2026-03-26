import mongoose from 'mongoose';

const attendanceRecordSchema = mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'AttendanceSession',
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;
