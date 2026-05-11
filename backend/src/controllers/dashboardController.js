import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Billing from '../models/Billing.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req, res) => {
  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    todayAppointments,
    totalRevenue,
    pendingBills,
    appointmentsByStatus,
    recentAppointments,
  ] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Billing.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    Billing.countDocuments({ status: 'unpaid' }),
    Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.find()
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort('-createdAt')
      .limit(5),
  ]);

  res.json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingBills,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentAppointments,
    },
  });
});

export const getRevenueChart = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  const date = new Date();
  date.setMonth(date.getMonth() - parseInt(months));

  const revenue = await Billing.aggregate([
    {
      $match: {
        createdAt: { $gte: date },
        status: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$paidAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: revenue });
});
