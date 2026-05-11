import Appointment from '../models/Appointment.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAppointments = asyncHandler(async (req, res) => {
  const { status, doctor, patient, date, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (doctor) query.doctor = doctor;
  if (patient) query.patient = patient;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }

  if (req.user.role === 'patient') {
    const patientRecord = await Patient.findOne({ user: req.user._id });
    if (patientRecord) query.patient = patientRecord._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('department', 'name')
      .sort('-date')
      .skip(skip)
      .limit(parseInt(limit)),
    Appointment.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { appointments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .populate('department', 'name');
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  res.json({ success: true, data: appointment });
});

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.create(req.body);
  const populated = await Appointment.findById(appointment._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .populate('department', 'name');
  res.status(201).json({ success: true, data: populated });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  const populated = await Appointment.findById(appointment._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .populate('department', 'name');
  res.json({ success: true, data: populated });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  res.json({ success: true, message: 'Appointment cancelled' });
});
