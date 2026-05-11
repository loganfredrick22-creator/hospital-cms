import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from './models/User.js';
import Department from './models/Department.js';
import Doctor from './models/Doctor.js';
import Patient from './models/Patient.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hospital-cms';

const seed = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create departments
    const departments = await Department.insertMany([
      { name: 'Cardiology', description: 'Heart and cardiovascular system' },
      { name: 'Neurology', description: 'Brain and nervous system' },
      { name: 'Pediatrics', description: 'Medical care for children' },
      { name: 'Orthopedics', description: 'Musculoskeletal system' },
      { name: 'Dermatology', description: 'Skin conditions' },
      { name: 'General Medicine', description: 'General health and wellness' },
    ]);
    console.log(`Created ${departments.length} departments`);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@hospital.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1-555-0100',
    });
    console.log(`Created admin: admin@hospital.com / Admin@123`);

    // Create doctor users
    const doctorUsers = await User.insertMany([
      { name: 'Dr. Sarah Johnson', email: 'sarah@hospital.com', password: 'Doctor@123', role: 'doctor', phone: '+1-555-0101' },
      { name: 'Dr. Michael Chen', email: 'michael@hospital.com', password: 'Doctor@123', role: 'doctor', phone: '+1-555-0102' },
      { name: 'Dr. Emily Rodriguez', email: 'emily@hospital.com', password: 'Doctor@123', role: 'doctor', phone: '+1-555-0103' },
    ]);
    console.log(`Created ${doctorUsers.length} doctors`);

    // Create doctor profiles
    await Doctor.insertMany([
      { user: doctorUsers[0]._id, department: departments[0]._id, specialization: 'Interventional Cardiology', qualification: 'MD, FACC', experience: 15, consultationFee: 250 },
      { user: doctorUsers[1]._id, department: departments[1]._id, specialization: 'Neurological Surgery', qualification: 'MD, FAANS', experience: 12, consultationFee: 300 },
      { user: doctorUsers[2]._id, department: departments[2]._id, specialization: 'General Pediatrics', qualification: 'MD, FAAP', experience: 8, consultationFee: 180 },
    ]);
    console.log(`Created doctor profiles`);

    // Create receptionist
    await User.create({
      name: 'Receptionist',
      email: 'reception@hospital.com',
      password: 'Reception@123',
      role: 'receptionist',
      phone: '+1-555-0199',
    });
    console.log(`Created receptionist: reception@hospital.com / Reception@123`);

    // Create sample patient
    const patientUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Patient@123',
      role: 'patient',
      phone: '+1-555-0200',
    });
    await Patient.create({
      user: patientUser._id,
      dateOfBirth: new Date('1985-06-15'),
      gender: 'male',
      bloodGroup: 'O+',
      address: '123 Main St, New York, NY 10001',
      emergencyContact: { name: 'Jane Doe', phone: '+1-555-0299', relationship: 'Spouse' },
    });
    console.log(`Created patient: john@example.com / Patient@123`);

    console.log('\n=== SEED COMPLETE ===');
    console.log('Admin:         admin@hospital.com / Admin@123');
    console.log('Doctor:        sarah@hospital.com / Doctor@123');
    console.log('Receptionist:  reception@hospital.com / Reception@123');
    console.log('Patient:       john@example.com / Patient@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
