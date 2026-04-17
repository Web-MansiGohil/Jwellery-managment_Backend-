import { Appointment } from "../Models/Appointment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const createAppointment = asyncHandler(async (req, res) => {
  console.log("DEBUG: Entered createAppointment controller");
  console.log("DEBUG: req.user exists?", !!req.user);
  // Extensive field name checking for user convenience
  const date = req.body.date;
  const timeslot = req.body.timeslot || req.body.timeSlot || req.body.timesSlot;
  const note = req.body.note || req.body.notes;
  const userId = req.user?._id;

  if (!date || !timeslot) {
    throw new ApiError("Date and timeslot are required");
  }

  if (!userId) {
    throw new ApiError("User not found");
  }
  if (date <= Date.now()) {
    throw new ApiError("Appointment date cannot be in the past");
  }
  if (timeslot <= Date.now()) {
    throw new ApiError("Appointment timeslot cannot be in the past");
  }
  // Handle image file from multer OR direct URL from body
  let images = null;
  if (req.file) {
    images = req.file.path.replace(/\\/g, "/");
  } else if (req.body.image) {
    images = req.body.image;
  }

  const appointment = new Appointment({
    userId,
    date,
    timeslot,
    note,
    images,
  });

  await appointment.save();
  res
    .status(201)
    .json({ message: "Appointment scheduled successfully", appointment });
});

export const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(appointments);
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id).populate(
    "userId",
    "name email",
  );
  if (!appointment) throw new ApiError("Appointment not found");

  return res
    .status(200)
    .json(new ApiResponse(appointment, "Appointment fetched successfully"));
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError("Appointment not found");

  // Normalize field names in request body for compatibility
  if (req.body.timeSlot) {
    req.body.timeslot = req.body.timeSlot;
    delete req.body.timeSlot;
  }
  if (req.body.notes) {
    req.body.note = req.body.notes;
    delete req.body.notes;
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  return res
    .status(200)
    .json(
      new ApiResponse(updatedAppointment, "Appointment updated successfully"),
    );
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError("Status is required");

  if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
    throw new ApiError("Invalid status");
  }

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  );

  if (!appointment) throw new ApiError("Appointment not found");

  return res
    .status(200)
    .json(
      new ApiResponse(appointment, "Appointment status updated successfully"),
    );
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError("Appointment not found");

  await Appointment.findByIdAndDelete(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse({}, "Appointment cancelled successfully"));
});
