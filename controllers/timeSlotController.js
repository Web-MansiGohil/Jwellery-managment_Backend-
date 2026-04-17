import { TimeSlot } from "../Models/TimeSlot.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// @desc Add a new time slot
// @route POST /api/timeslots/add
// @access Private (Admin)
export const createTimeSlot = asyncHandler(async (req, res) => {
    const { date, startTime, endTime } = req.body;

    if ([date, startTime, endTime].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields (date, startTime, endTime) are required");
    }

    const existingSlot = await TimeSlot.findOne({ date: new Date(date), startTime, endTime });
    if (existingSlot) {
        throw new ApiError(409, "Time slot already exists for this date");
    }

    const timeSlot = await TimeSlot.create({
        date: new Date(date),
        startTime,
        endTime
    });

    return res.status(201).json(
        new ApiResponse(timeSlot, "Time slot created successfully")
    );
});

// @desc Get time slots by date
// @route GET /api/timeslots/:date
// @access Public
export const getTimeSlotsByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    
    // Normalize date to start of day for searching
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await TimeSlot.find({
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).sort({ startTime: 1 });

    return res.status(200).json(
        new ApiResponse(slots, "Time slots fetched successfully")
    );
});

// @desc Delete a time slot
// @route DELETE /api/timeslots/delete/:id
// @access Private (Admin)
export const deleteTimeSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const timeSlot = await TimeSlot.findByIdAndDelete(id);

    if (!timeSlot) {
        throw new ApiError(404, "Time slot not found");
    }

    return res.status(200).json(
        new ApiResponse({}, "Time slot deleted successfully")
    );
});

// @desc Get all time slots (Admin View)
// @route GET /api/timeslots/all
// @access Private (Admin)
export const getAllTimeSlots = asyncHandler(async (req, res) => {
    const slots = await TimeSlot.find().sort({ date: 1, startTime: 1 });

    return res.status(200).json(
        new ApiResponse(slots, "All time slots fetched successfully")
    );
});

// @desc Update a time slot
// @route PUT /api/timeslots/update/:id
// @access Private (Admin)
export const updateTimeSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, startTime, endTime } = req.body;

    const timeSlot = await TimeSlot.findById(id);

    if (!timeSlot) {
        throw new ApiError(404, "Time slot not found");
    }

    if (date) timeSlot.date = new Date(date);
    if (startTime) timeSlot.startTime = startTime;
    if (endTime) timeSlot.endTime = endTime;

    await timeSlot.save();

    return res.status(200).json(
        new ApiResponse(timeSlot, "Time slot updated successfully")
    );
});
