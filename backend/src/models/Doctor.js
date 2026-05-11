import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    specialization: { type: String, required: [true, 'Specialization is required'], trim: true },
    qualification: { type: String, required: [true, 'Qualification is required'], trim: true },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    licenseNumber: { type: String, default: '', trim: true },
    availableDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    availableTimeSlots: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    maxPatientsPerDay: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
