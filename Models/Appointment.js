import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    date: { type: Date, required: true },
    timeslot: { type: String, required: true },
    status: { type: String, enum: ['Booked', 'Completed', 'Cancelled'], default: 'Booked' },
    note: { type: String },
    images: { type: String }
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);