import type mongoose from "mongoose";
import type { Document } from "mongoose";

export interface IAdmin extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password: string;
}