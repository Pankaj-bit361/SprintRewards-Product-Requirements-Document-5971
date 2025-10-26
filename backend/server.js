import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sprintRoutes from './routes/sprints.js';
import transactionRoutes from './routes/transactions.js';
import communityRoutes from './routes/communities.js';
import uploadRoutes from './routes/uploads.js';
import { initializeCronJobs } from './services/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/uploads', uploadRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sprint Rewards! 🏃‍♂️',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      sprints: '/api/sprints',
      transactions: '/api/transactions',
      health: '/api/health'
    },
    documentation: 'https://github.com/your-repo/sprint-rewards'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SprintRewards API is running'
  });
});

// Connect to MongoDB (for Vercel serverless)
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Initialize DB connection
connectDB();

// Initialize cron jobs for automatic sprint management
if (process.env.NODE_ENV !== 'production') {
  // Only run cron jobs in development/local environment
  // In production, use a separate worker process or cloud scheduler
  initializeCronJobs();
}

// Export the app for Vercel
export default app;

// Only start server in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Welcome to Sprint Rewards API! Visit http://localhost:${PORT}`);
  });
}