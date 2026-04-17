import { Appointment } from '../Models/Appointment.js';
import { TimeSlot } from '../Models/TimeSlot.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendEmail } from '../utils/sendEmail.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { User } from '../Models/User.js';
import mongoose from 'mongoose';

export const createAppointment = asyncHandler(async (req, res) => {
    // Extensive field name checking for user convenience
    const userId = req.user._id;
    const { date, timeslot, note, name, email, phone } = req.body;

    if (!date || !timeslot) {
        throw new ApiError(400, "Date and timeslot are required");
    }
    const user = req.user; // already validated by tokenVerify
    // Validation for past date and time
    const now = new Date();

    // Parse date safely (expecting YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number);
    const appointmentDay = new Date(year, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (appointmentDay < today) {
        throw new ApiError(400, "Please select a valid date and time. You have selected a past time.");
    }

    if (appointmentDay.getTime() === today.getTime()) {
        const timePart = timeslot.split('-')[0].trim();
        const match = timePart.match(/(\d+):(\d+)\s*(AM|PM)?/i);

        if (match) {
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const modifier = match[3] ? match[3].toUpperCase() : null;

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            // Block after 10:00 PM (22:00)
            if (hours >= 22) {
                throw new ApiError(400, "Please select a valid time slot. Appointments are not available after 10:00 PM.");
            }

            const appointmentTime = new Date(year, month - 1, day, hours, minutes);
            if (appointmentTime < now) {
                throw new ApiError(400, "Please select a valid date and time. You have selected a past time.");
            }
        }
    } else {
        // Even for future dates, check the 10:00 PM limit if time is specified
        const timePart = timeslot.split('-')[0].trim();
        const match = timePart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
            let hours = parseInt(match[1], 10);
            if (match[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;

            if (hours >= 22) {
                throw new ApiError(400, "Please select a valid time slot. Appointments are not available after 10:00 PM.");
            }
        }
    }
    // Handle image file upload (Cloudinary)
    let images = null;
    if (req.files && req.files.images && req.files.images[0]) {
        const file = req.files.images[0];
        const cloudinaryResult = await uploadOnCloudinary(file, "appointment");
        images = cloudinaryResult ? cloudinaryResult.secure_url : null;
    } else if (req.body.image || req.body.images) {
        images = req.body.image || req.body.images;
    }

    const appointment = new Appointment({
        userId,
        name,
        email,
        phone,
        date,
        timeslot,
        note,
        images
    });

    await appointment.save();

    // Populate simple user data before returning
    const populatedAppointment = await Appointment.findById(appointment._id).populate("userId", "username email phonenumber first_name last_name");

    // Mark the dynamic time slot as booked if it exists
    try {
        const timeParts = timeslot.split(' - ');
        if (timeParts.length === 2) {
            const startTime = timeParts[0].trim();
            const endTime = timeParts[1].trim();
            await TimeSlot.findOneAndUpdate(
                { date: new Date(date), startTime, endTime },
                { isBooked: true }
            );
        }
    } catch (err) {
        console.error("Error marking time slot as booked:", err);
    }

    res.status(201).json({ message: "Appointment scheduled successfully", appointment: populatedAppointment });
});

export const getAppointments = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find()
        .populate("userId", "username email phonenumber first_name last_name")
        .sort({ createdAt: -1 });
    res.json(appointments);
});

export const getAppointmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).populate("userId", "username email phonenumber first_name last_name");
    if (!appointment) throw new ApiError(404, "Appointment not found");

    // Ownership check: User can only view their own, Admin can view any
    if (req.user.role !== 'Admin' && appointment.userId._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to view this appointment");
    }

    return res.status(200).json({
        success: true,
        message: "Appointment fetched successfully",
        appointment
    });
});

export const updateAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).populate("userId");
    if (!appointment) throw new ApiError(404, "Appointment not found");

    // Ownership check: User can only update their own, Admin can update any
    if (req.user.role !== 'Admin' && appointment.userId._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this appointment");
    }

    // Normalize field names in request body for compatibility
    if (req.body.timeSlot) {
        req.body.timeslot = req.body.timeSlot;
        // delete req.body.timeSlot;
    }
    if (req.body.notes) {
        req.body.note = req.body.notes;
        // delete req.body.notes;
    }

    const isDateChanged = req.body.date && new Date(req.body.date).getTime() !== new Date(appointment.date).getTime();
    const isTimeChanged = req.body.timeslot && req.body.timeslot !== appointment.timeslot;

    console.log('DEBUG 10: isDateChanged:', isDateChanged, 'isTimeChanged:', isTimeChanged);
    console.log('DEBUG 10: Role:', req.user.role, 'User email:', appointment.userId?.email);

    // Strict validation for new date/time
    if (isDateChanged || isTimeChanged) {
        const newDate = req.body.date || appointment.date;
        const newTime = req.body.timeslot || appointment.timeslot;

        const now = new Date();
        const [year, month, day] = (typeof newDate === 'string' ? newDate : new Date(newDate).toISOString().split('T')[0]).split('-').map(Number);
        const appointmentDay = new Date(year, month - 1, day);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (appointmentDay < today) {
            throw new ApiError(400, "Please select a valid date and time. You have selected a past time.");
        }

        const timePart = newTime.split('-')[0].trim();
        const match = timePart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
            let hours = parseInt(match[1], 10);
            if (match[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;

            if (hours >= 22) {
                throw new ApiError(400, "Please select a valid time slot. Appointments are not available after 10:00 PM.");
            }

            if (appointmentDay.getTime() === today.getTime()) {
                const appointmentTime = new Date(year, month - 1, day, hours, parseInt(match[2], 10));
                if (appointmentTime < now) {
                    throw new ApiError(400, "Please select a valid date and time. You have selected a past time.");
                }
            }
        }
    }
    // Cloudinary
    if (req.files && req.files.images && req.files.images[0]) {
        const file = req.files.images[0];
        const cloudinaryResult = await uploadOnCloudinary(file, "appointment");
        if (cloudinaryResult) {
            req.body.images = cloudinaryResult.secure_url;
        }
        req.body.images = `/images/${file.filename}`;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (isDateChanged || isTimeChanged) {
        console.log('DEBUG 11: Inside email block. Checking role and email...');
        if (req.user.role === 'Admin' && appointment.userId && appointment.userId.email) {
            console.log('DEBUG 12: Sending rescheduling email to:', appointment.userId.email);
            const oldDateStr = new Date(appointment.date).toDateString();
            const newDateStr = new Date(updatedAppointment.date).toDateString();

            const emailSubject = "Appointment Rescheduling Notification";
            const emailText = `Your appointment originally scheduled for ${oldDateStr} at ${appointment.timeslot} has been rescheduled to ${newDateStr} at ${updatedAppointment.timeslot} due to unforeseen circumstances. We apologize for any inconvenience caused.`;

            try {
                const res = await sendEmail(appointment.userId.email, emailSubject, emailText);
                console.log('DEBUG 13: sendEmail result:', res);
            } catch (error) {
                console.log('DEBUG 14: sendEmail ERROR:', error.message);
                console.error("Error sending email:", error);
            }
        } else {
            console.log('DEBUG 15: Skipping email. Admin Role check:', req.user.role === 'Admin', 'Email exists:', !!appointment.userId?.email);
        }
    }

    return res.status(200).json({
        message: "Appointment updated successfully",
        appointment: updatedAppointment
    });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw new ApiError(400, "Status is required");

    if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!appointment) throw new ApiError("Appointment not found");

    return res.status(200).json({
        success: true,
        message: "Appointment status updated successfully",
        appointment
    });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) throw new ApiError(404, "Appointment not found");

    // Ownership check: User can only delete their own, Admin can delete any
    if (req.user.role !== 'Admin' && appointment.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this appointment");
    }

    await Appointment.findByIdAndDelete(id);
    return res.status(200).json({
        success: true,
        message: "Appointment cancelled/deleted successfully"
    });
});