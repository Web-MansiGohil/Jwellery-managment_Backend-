import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: true 
    },
    startTime: { 
        type: String, 
        required: true 
    },
    endTime: { 
        type: String, 
        required: true 
    },
    isBooked: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Ensure unique time slots for a given date and time range
timeSlotSchema.index({ date: 1, startTime: 1, endTime: 1 }, { unique: true });

export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
