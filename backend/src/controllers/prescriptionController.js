import Prescription from '../models/Prescription.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getPrescriptions = asyncHandler(async (req, res) => {
  const { patient, doctor, page = 1, limit = 10 } = req.query;
  const query = {};
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [prescriptions, total] = await Promise.all([
    Prescription.find(query)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Prescription.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { prescriptions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  res.json({ success: true, data: prescription });
});

export const createPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.create(req.body);
  const populated = await Prescription.findById(prescription._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
  res.status(201).json({ success: true, data: populated });
});

export const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  const populated = await Prescription.findById(prescription._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });
  res.json({ success: true, data: populated });
});

export const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByIdAndDelete(req.params.id);
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  res.json({ success: true, message: 'Prescription deleted' });
});
