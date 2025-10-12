# SprintRewards Backend

This is the backend server for the SprintRewards employee recognition system.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the MongoDB connection string
   - Set your JWT secret
   - Add OpenAI API key for AI features

3. **Database Setup**
   - Make sure MongoDB is running locally or update the connection string for a cloud database
   - The application will create the necessary collections automatically

4. **Start the Server**
   ```bash
   npm run dev  # Development mode with nodemon
   npm start    # Production mode
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (for initial setup)
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all employees (founder only)
- `POST /api/users` - Add new employee (founder only)
- `PUT /api/users/:id` - Update employee (founder only)
- `DELETE /api/users/:id` - Delete employee (founder only)
- `GET /api/users/leaderboard` - Get leaderboard data
- `POST /api/users/unlock-points` - Unlock reward points (weekends only)

### Transactions
- `POST /api/transactions/send` - Send points to another user
- `GET /api/transactions/history` - Get user's transaction history
- `GET /api/transactions/all` - Get all transactions (founder only)

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Sprints
- `GET /api/sprints/current` - Get current sprint
- `GET /api/sprints` - Get all sprints (founder only)
- `POST /api/sprints` - Create new sprint (founder only)

## Cron Jobs

The system runs automated tasks:
- **Friday 12:00 AM**: Run AI eligibility checks for all employees
- **Monday 6:00 AM**: Reset sprint and start new cycle

## Default Accounts

For testing purposes, you can create these accounts:

**Founder Account:**
- Email: founder@example.com
- Password: password123
- Role: founder

**Employee Account:**
- Email: employee@example.com  
- Password: password123
- Role: employee

## AI Integration

The system includes a mock AI service for task validation. To integrate with a real AI service:

1. Update the `aiService.js` file
2. Implement actual AI logic in the `runAICheck` function
3. Connect to OpenAI or your preferred AI service

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection

## Database Schema

The system uses MongoDB with the following collections:
- `users` - Employee and founder accounts
- `tasks` - Sprint tasks and progress tracking
- `transactions` - Point transfers and unlocks
- `sprints` - Sprint cycles and eligibility data