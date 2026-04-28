const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- Import Route Files ---
const buildingRoutes = require('./routes/buildings');
const departmentRoutes = require('./routes/departments');
const facultyRoutes = require('./routes/faculty');
const classroomRoutes = require('./routes/classrooms');
const detailRoutes = require('./routes/details'); // <-- ADD THIS LINE
const routingRoutes = require('./routes/routing'); 
// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => {
  console.log('Successfully connected to MongoDB.');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});


// --- API Routes ---
app.use('/api/buildings', buildingRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/details', detailRoutes); // <-- ADD THIS LINE
app.use('/api/routing', routingRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});