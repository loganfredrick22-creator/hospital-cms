import Billing from '../models/Billing.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getBillings = asyncHandler(async (req, res) => {
  const { status, patient, page = 1, limit = 10 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (patient) query.patient = patient;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [billings, total] = await Promise.all([
    Billing.find(query)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'appointment', select: 'date timeSlot' })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Billing.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: { billings, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getBilling = asyncHandler(async (req, res) => {
  const billing = await Billing.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
    .populate({ path: 'appointment', select: 'date timeSlot' });
  if (!billing) throw new ApiError(404, 'Billing record not found');
  res.json({ success: true, data: billing });
});

export const createBilling = asyncHandler(async (req, res) => {
  const { items, totalAmount } = req.body;
  let calculatedTotal = 0;
  if (items) {
    calculatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
  const billing = await Billing.create({
    ...req.body,
    totalAmount: totalAmount || calculatedTotal,
  });
  const populated = await Billing.findById(billing._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } });
  res.status(201).json({ success: true, data: populated });
});

export const updateBilling = asyncHandler(async (req, res) => {
  const billing = await Billing.findById(req.params.id);
  if (!billing) throw new ApiError(404, 'Billing record not found');

  const { items, paidAmount, status, paymentMethod, notes } = req.body;
  if (items !== undefined) {
    billing.items = items;
    billing.totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
  if (paidAmount !== undefined) billing.paidAmount = paidAmount;
  if (status !== undefined) billing.status = status;
  if (paymentMethod !== undefined) billing.paymentMethod = paymentMethod;
  if (notes !== undefined) billing.notes = notes;
  await billing.save();

  if (billing.paidAmount >= billing.totalAmount && billing.status !== 'cancelled') {
    billing.status = 'paid';
    await billing.save();
  } else if (billing.paidAmount > 0 && billing.paidAmount < billing.totalAmount) {
    billing.status = 'partial';
    await billing.save();
  }

  const populated = await Billing.findById(billing._id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } });
  res.json({ success: true, data: populated });
});

export const deleteBilling = asyncHandler(async (req, res) => {
  const billing = await Billing.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  if (!billing) throw new ApiError(404, 'Billing record not found');
  res.json({ success: true, message: 'Billing cancelled' });
});
