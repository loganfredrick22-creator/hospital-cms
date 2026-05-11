import api from './api';

const createService = (endpoint) => ({
  getAll: (params) => api.get(`/${endpoint}`, { params }).then((r) => r.data),
  getById: (id) => api.get(`/${endpoint}/${id}`).then((r) => r.data),
  create: (data) => api.post(`/${endpoint}`, data).then((r) => r.data),
  update: (id, data) => api.put(`/${endpoint}/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/${endpoint}/${id}`).then((r) => r.data),
});

export const userService = createService('users');
export const departmentService = createService('departments');
export const doctorService = createService('doctors');
export const patientService = createService('patients');
export const appointmentService = createService('appointments');
export const medicalRecordService = createService('medical-records');
export const prescriptionService = createService('prescriptions');
export const billingService = createService('billing');

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then((r) => r.data),
  getRevenue: (params) => api.get('/dashboard/revenue', { params }).then((r) => r.data),
};
