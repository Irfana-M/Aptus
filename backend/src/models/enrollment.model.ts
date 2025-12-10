import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: "pending_payment" | "active" | "cancelled";
  subscription?: mongoose.Types.ObjectId;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending_payment", "active", "cancelled"],
      default: "pending_payment",
    },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
  },
  { timestamps: true }
);


EnrollmentSchema.index({ student: 1 });
EnrollmentSchema.index({ course: 1 });
EnrollmentSchema.index({ status: 1 });


EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
