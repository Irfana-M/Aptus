import mongoose, { Document, Schema } from "mongoose";
import type { IAdmin } from "../../interfaces/models/admin.interface";

const adminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true, collection: "admin" }
);

export const Admin = mongoose.model<IAdmin>("Admin", adminSchema);
