import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './src/config/index.js';
import connectDB from './src/config/db.js';
import errorHandler from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import departmentRoutes from './src/routes/departmentRoutes.js';
import doctorRoutes from './src/routes/doctorRoutes.js';
import patientRoutes from './src/routes/patientRoutes.js';
import appointmentRoutes from './src/routes/appointmentRoutes.js';
import medicalRecordRoutes from './src/routes/medicalRecordRoutes.js';
import prescriptionRoutes from './src/routes/prescriptionRoutes.js';
import billingRoutes from './src/routes/billingRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Hospital CMS API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  connectDB().catch((err) => {
    console.error('Failed to connect to database. Server running without DB:', err.message);
  });
});
