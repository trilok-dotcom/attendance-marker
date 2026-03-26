import mongoose from 'mongoose';

const studentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    rollNo: {
        type: String,
        required: true,
        unique: true,
    },
    barcodeId: {
        type: String,
        required: true,
        unique: true,
    },
    classId: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
