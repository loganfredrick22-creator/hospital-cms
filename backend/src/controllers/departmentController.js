import Department from '../models/Department.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('headDoctor', 'name email');
  res.json({ success: true, data: departments });
});

export const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('headDoctor', 'name email');
  if (!department) throw new ApiError(404, 'Department not found');
  res.json({ success: true, data: department });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) throw new ApiError(404, 'Department not found');
  res.json({ success: true, data: department });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw new ApiError(404, 'Department not found');
  department.isActive = false;
  await department.save();
  res.json({ success: true, message: 'Department deactivated' });
});
