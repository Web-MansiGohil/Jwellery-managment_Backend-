import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    otp: {
        type: String
    },
    email: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Otp = mongoose.model("Otp", otpSchema);
