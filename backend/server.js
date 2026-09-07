const dotenv = require('dotenv');
dotenv.config(); // MUST be first — loads JWT_SECRET and other env vars

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const leadRoutes = require('./routes/leadRoutes');
const dealRoutes = require('./routes/dealRoutes');
const taskRoutes = require('./routes/taskRoutes');
const activityRoutes = require('./routes/activityRoutes');
const reportRoutes   = require('./routes/reportRoutes');
const profileRoutes  = require('./routes/profileRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/profile',   profileRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});