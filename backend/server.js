import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sprintRoutes from './routes/sprints.js';
import transactionRoutes from './routes/transactions.js';
import taskRoutes from './routes/tasks.js';
import { runWeeklyAICheck, resetSprint } from './services/aiService.js';

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
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SprintRewards API is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Cron jobs
// Run AI check every Friday at midnight
cron.schedule('0 0 * * 5', () => {
  console.log('Running weekly AI eligibility check...');
  runWeeklyAICheck();
});

// Reset sprint every Monday at 6 AM
cron.schedule('0 6 * * 1', () => {
  console.log('Resetting sprint...');
  resetSprint();
});