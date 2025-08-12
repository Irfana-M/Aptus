import mongoose, { Schema } from 'mongoose';
const parentInfoSchema = new Schema({
    name: String,
    email: String,
    phone: String,
});
const contactInfoSchema = new Schema({
    parentInfo: parentInfoSchema,
    address: String,
    country: String,
    postalCode: String,
});
const academicDetailsSchema = new Schema({
    institutionName: String,
    grade: String,
    syllabus: String,
});
const studentSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    dateOfBirth: { type: Date },
    contactInfo: contactInfoSchema,
    academicDetails: academicDetailsSchema,
    profileImage: { type: String },
    goal: { type: String },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });
export const StudentModel = mongoose.model('Student', studentSchema);
//# sourceMappingURL=student.model.js.map