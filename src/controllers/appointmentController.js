import Appointment from '../models/Appointment.js';
import { sendAppointmentConfirmation } from '../utils/email.js';

// POST /api/appointments
export const createAppointment = async (req, res, next) => {
  try {
    const {
      name, email, phone, organization,
      appointmentType, preferredDate, preferredTime,
      patientType, gender, department, message,
    } = req.body;

    if (!name || !email || !phone || !appointmentType || !preferredDate) {
      return res.status(400).json({
        success: false,
        error: 'name, email, phone, appointmentType, and preferredDate are required.',
      });
    }

    const appointment = await Appointment.create({
      name, email, phone, organization,
      appointmentType, preferredDate, preferredTime,
      patientType, gender, department, message,
    });

    // Send confirmation emails (fire and forget — don't block response)
    sendAppointmentConfirmation(appointment).catch((err) =>
      console.error('Email send failed:', err.message)
    );

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments  (admin only)
export const listAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
};
