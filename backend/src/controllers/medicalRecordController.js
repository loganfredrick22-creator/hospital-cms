import MedicalRecord from '../models/MedicalRecord.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMedicalRecords = asyncHandler(async (req, res) => {
  const { patient, doctor, page = 1, limit = 10 } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [records, total] = await Promise.all([
    MedicalRecord.find(query)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('appointment')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    MedicalRecord.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { records, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .populate('appointment');
  if (!record) throw new ApiError(404, 'Medical record not found');
  res.json({ success: true, data: record });
});

export const createMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.create({ ...req.body, doctor: req.body.doctor });
  const populated = await MedicalRecord.findById(record._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
  res.status(201).json({ success: true, data: populated });
});

export const updateMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!record) throw new ApiError(404, 'Medical record not found');
  const populated = await MedicalRecord.findById(record._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
  res.json({ success: true, data: populated });
});

export const deleteMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndDelete(req.params.id);
  if (!record) throw new ApiError(404, 'Medical record not found');
  res.json({ success: true, message: 'Medical record deleted' });
});
