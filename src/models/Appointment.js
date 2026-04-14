import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    organization: { type: String, trim: true, default: '' },
    appointmentType: { type: String, required: true, trim: true },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, default: '' },
    patientType: { type: String, default: '' },
    gender: { type: String, default: '' },
    department: { type: String, default: '' },
    message: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
