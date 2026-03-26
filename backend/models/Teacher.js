import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teacherSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    assignedClasses: [{
        type: String
    }],
    timetable: {
        type: Array,
        default: []
    }
}, {
    timestamps: true,
});

teacherSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

teacherSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
