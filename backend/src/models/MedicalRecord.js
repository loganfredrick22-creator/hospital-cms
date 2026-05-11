import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    diagnosis: { type: String, required: [true, 'Diagnosis is required'] },
    symptoms: { type: [String], default: [] },
    testResults: [{ testName: String, result: String, date: Date }],
    treatment: { type: String, default: '' },
    notes: { type: String, default: '' },
    isConfidential: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('MedicalRecord', medicalRecordSchema);
