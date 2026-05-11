import Patient from '../models/Patient.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getPatients = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  let userFilter = {};
  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    userFilter = { user: { $in: users.map((u) => u._id) } };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [patients, total] = await Promise.all([
    Patient.find(userFilter)
      .populate({ path: 'user', select: 'name email phone' })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Patient.countDocuments(userFilter),
  ]);

  res.json({
    success: true,
    data: { patients, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate({ path: 'user', select: 'name email phone avatar' });
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json({ success: true, data: patient });
});

export const createPatient = asyncHandler(async (req, res) => {
  const { user: userData, ...patientData } = req.body;
  const user = await User.create({ ...userData, role: 'patient' });
  const patient = await Patient.create({ ...patientData, user: user._id });
  const populated = await Patient.findById(patient._id)
    .populate({ path: 'user', select: 'name email phone' });
  res.status(201).json({ success: true, data: populated });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const { user: userData, ...patientData } = req.body;
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');

  if (userData) {
    await User.findByIdAndUpdate(patient.user, userData, { runValidators: true });
  }
  Object.assign(patient, patientData);
  await patient.save();

  const populated = await Patient.findById(patient._id)
    .populate({ path: 'user', select: 'name email phone' });
  res.json({ success: true, data: populated });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');
  await User.findByIdAndUpdate(patient.user, { isActive: false });
  res.json({ success: true, message: 'Patient deactivated' });
});
