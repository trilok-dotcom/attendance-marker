# Barcode-Based Attendance System

A full-stack MERN application for scanning student barcodes and managing class attendance.

## Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI (update `backend/.env`)

## Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the database seed script to create a test teacher and students:
   ```bash
   node seed.js
   ```
   **Test Credentials**:
   - Email: `teacher@test.com`
   - Password: `password123`
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   (Server runs on http://localhost:5000)

## Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   (App runs on http://localhost:5173 / usually)

## Usage
1. Go to the frontend URL.
2. Log in using the test credentials.
3. On the Dashboard, select a class and subject, then click **Start Session**.
4. In the Scanner page, hold a barcode in front of your camera (you can generate 1D barcodes for `12345`, `23456`, `34567` online to test).
5. Click **End Session** to view the Attendance Report.
