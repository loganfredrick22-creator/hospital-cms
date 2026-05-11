# Hospital & Clinic Management System

A full-stack MERN application for managing hospital/clinic operations including patients, doctors, appointments, medical records, prescriptions, and billing.

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, shadcn/ui, TanStack Query, Zustand, Recharts, React Router v6, React Hook Form + Zod
- **Backend:** Node.js, Express.js, Mongoose ODM
- **Database:** MongoDB
- **Auth:** JWT (access + refresh tokens), bcryptjs

## Local Setup (One Command)

```bash
# Clone and install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Manual Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Default Login

Create a user via POST /api/auth/register or seed the database manually.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /api/auth/register | Register new user |
| POST /api/auth/login | Login |
| POST /api/auth/refresh | Refresh access token |
| POST /api/auth/logout | Logout |
| GET /api/auth/me | Get current user |
| GET/POST /api/users | Users CRUD |
| GET/POST /api/departments | Departments CRUD |
| GET/POST /api/doctors | Doctors CRUD |
| GET/POST /api/patients | Patients CRUD |
| GET/POST /api/appointments | Appointments CRUD |
| GET/POST /api/medical-records | Medical Records CRUD |
| GET/POST /api/prescriptions | Prescriptions CRUD |
| GET/POST /api/billing | Billing CRUD |
| GET /api/dashboard/stats | Dashboard statistics |
| GET /api/dashboard/revenue | Revenue chart data |

## Deployment

### Frontend (Vercel)

1. Push frontend to a GitHub repo
2. Import project in Vercel
3. Set root directory to `frontend`
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Add env vars in Vercel dashboard

### Backend (Render)

1. Push backend to GitHub
2. Create a new Web Service on Render
3. Set root directory to `backend`
4. Start command: `npm start`
5. Add env vars in Render dashboard

### Database (MongoDB Atlas)

1. Create a free cluster on MongoDB Atlas
2. Get the connection string
3. Set as `MONGO_URI` env var

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hospital-cms
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=/api
```
