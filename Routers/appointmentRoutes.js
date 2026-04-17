import express from 'express';
import { createAppointment, getAppointments, getAppointmentById, updateAppointment, deleteAppointment, updateAppointmentStatus } from '../Controllers/appointmentController.js';
import { adminOnly, tokenVerify } from '../Middleware/authMiddleware.js';
import { upload } from '../Middleware/multerMidleware.js';

const router = express.Router();

// Create appointment
// @api
// des : create appointment
// method : POST
// endpoint : /api/appointment/add-appointment
router.post('/add-appointment', tokenVerify, upload.fields([{ name: 'images', maxCount: 1 }]), createAppointment);

//  Get all appointments
// /api/appointment/
router.get('/', getAppointments);

//Get appointment by ID
// @api
// des : get appointment by id
// method : GET
// endpoint : /api/appointment/:id

router.get('/:id', getAppointmentById);

//  Update appointment
// @api
// des : update appointment
// method : PATCH
// endpoint : /api/appointment/update/:id
router.put('/update/:id', tokenVerify, upload.fields([{ name: 'images', maxCount: 1 }]), updateAppointment);

// Update appointment status
// @api
// des : update appointment status
// method : PATCH
// endpoint : /api/appointment/update/:id/status
router.patch('/update/:id/status', tokenVerify, adminOnly, updateAppointmentStatus);

// Delete appointment
// @api
// des : delete appointment
// method : DELETE
// endpoint : /api/appointment/delete/:id   
router.delete('/delete/:id', tokenVerify, deleteAppointment);

export default router;