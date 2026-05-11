import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDoctors = asyncHandler(async (req, res) => {
  const { department, search, page = 1, limit = 10 } = req.query;
  const query = {};
  if (department) query.department = department;
  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    query.user = { $in: users.map((u) => u._id) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .populate({ path: 'user', select: 'name email phone' })
      .populate('department', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Doctor.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { doctors, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate({ path: 'user', select: 'name email phone avatar' })
    .populate('department', 'name');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json({ success: true, data: doctor });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const { user: userData, ...doctorData } = req.body;
  const user = await User.create({ ...userData, role: 'doctor' });
  const doctor = await Doctor.create({ ...doctorData, user: user._id });
  const populated = await Doctor.findById(doctor._id)
    .populate({ path: 'user', select: 'name email phone' })
    .populate('department', 'name');
  res.status(201).json({ success: true, data: populated });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const populated = await Doctor.findById(doctor._id)
    .populate({ path: 'user', select: 'name email phone' })
    .populate('department', 'name');
  res.json({ success: true, data: populated });
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  doctor.isActive = false;
  await doctor.save();
  await User.findByIdAndUpdate(doctor.user, { isActive: false });
  res.json({ success: true, message: 'Doctor deactivated' });
});
