# Bravo Rewards - Employee Recognition & Reward System

A comprehensive employee recognition system that motivates team members through sprint-based point unlocking and peer-to-peer appreciation with OTP-based authentication.

## 🌟 Key Features

1. **OTP-Based Authentication** - Secure email-based OTP login with AWS SES integration
2. **Sprint-based Point System** - Employees earn sprint points (0-12 scale) and unlock 500 reward points on weekends
3. **Peer-to-Peer Recognition** - Send reward points to colleagues with optional messages
4. **Real-time Leaderboards** - Track top point givers and receivers across communities
5. **Multi-Community Support** - Create and manage multiple communities with different settings
6. **Admin Dashboard** - Community owners can manage employees, view analytics, and adjust points
7. **Transaction History** - Complete audit trail of all point transfers and unlocks
8. **Theme System** - 5 customizable themes (Mehendi, Ocean, Forest, Sunset, Purple) with dark bluish design
9. **Community Management** - Create communities, invite members, manage roles (owner, admin, member)
10. **Sprint Management** - Automated weekly sprints with eligibility tracking and statistics

## 🚀 Quick Start

### System Requirements

#### Required
- **Node.js**: v16 or higher
- **npm**: v7 or higher (comes with Node.js)
- **MongoDB**: Local instance or MongoDB Atlas cloud database
- **Git**: For cloning the repository

#### Optional but Recommended
- **Yarn**: Alternative package manager
- **Docker**: For running MongoDB in a container
- **Postman**: For testing API endpoints

### External Services Required

1. **AWS SES** (for OTP emails)
   - AWS Account with SES service enabled
   - AWS Access Key ID and Secret Access Key
   - Verified email address in SES

2. **MongoDB**
   - Local MongoDB instance, OR
   - MongoDB Atlas cloud account (free tier available)

### Installation & Setup

#### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd SprintRewards
```

#### Step 2: Install Frontend Dependencies
```bash
npm install
```

#### Step 3: Install Backend Dependencies
```bash
npm run install:backend
```

#### Step 4: Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cd backend
touch .env
```

Add the following environment variables to `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
BACKEND_URL=http://localhost:3001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bravo-rewards
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bravo-rewards

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AWS SES Configuration (for OTP emails)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# S3 Configuration (optional, for community logos)
S3_BUCKET_NAME=your-bucket-name
S3_PUBLIC_BASE_URL=https://your-bucket.s3.region.amazonaws.com
```

#### Step 5: Start the Application

**Option A: Run both frontend and backend together**
```bash
npm run dev
```

**Option B: Run frontend and backend separately**

Terminal 1 - Frontend:
```bash
npm run dev:frontend
```

Terminal 2 - Backend:
```bash
npm run dev:backend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

#### Step 6: (Optional) Seed Sample Data
```bash
npm run seed
```

This will populate the database with sample users and data for testing.

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Routing**: React Router DOM
- **State Management**: Context API
- **HTTP Client**: Axios

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Password Hashing**: bcryptjs
- **Scheduling**: node-cron
- **Environment**: dotenv

## 📱 User Roles & Permissions

### Employee Features
- **Dashboard**: View current sprint points and reward points balance
- **Leaderboard**: See top point givers and receivers in the community
- **Send Points**: Send reward points to colleagues with optional messages
- **Transaction History**: View all point transfers and unlock history
- **Community Switching**: Switch between multiple communities
- **Profile Management**: View personal stats and achievements

### Community Owner Features
- **Member Management**: Add, edit, and remove community members
- **Admin Panel**: View all community members and their statistics
- **Transaction Monitoring**: View all transactions within the community
- **Community Settings**: Configure community name, description, and image
- **Invite Members**: Send invitations to new members
- **Analytics**: View community-wide statistics and engagement metrics

### Founder Features (System Admin)
- **All Community Owner Features**: Manage all communities
- **User Management**: Add, edit, and remove users across all communities
- **System Analytics**: View system-wide statistics and insights
- **Sprint Management**: Create and manage sprints
- **Transaction Logs**: Access complete transaction history
- **Point Adjustments**: Manually adjust user points if needed

## 📊 Sprint Cycle

1. **Sprint Start**: New weekly sprint begins (Monday)
2. **Sprint Active**: Employees accumulate sprint points (0-12 scale)
3. **Eligibility Check**: Employees with ≥8 sprint points become eligible
4. **Weekend Unlock**: Eligible employees can unlock 500 reward points (Saturday-Sunday only)
5. **Sprint Reset**: Monday morning - New sprint cycle begins with reset points

## 🔐 Security Features

- JWT-based authentication with role verification
- Password hashing using bcryptjs
- Protected API routes with middleware
- Input validation and sanitization
- CORS configuration for secure cross-origin requests

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#3B82F6 to #6366F1)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale (#F9FAFB to #111827)

### Typography
- **Headers**: Bold, clean sans-serif
- **Body**: Regular weight for readability
- **Code**: Monospace for technical elements

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Adapted layouts with touch-friendly controls
- **Mobile**: Streamlined interface with bottom navigation

## 🧪 Testing the Application

### OTP-Based Login
The application uses OTP (One-Time Password) authentication:

1. Enter your email address on the login page
2. Click "Send OTP"
3. Check your email for the 6-digit OTP code
4. Enter the OTP on the verification page
5. You'll be logged in and a new account will be created if it's your first time

**Note**: Make sure AWS SES is properly configured for OTP emails to work.

### Creating Test Data
```bash
# Seed the database with sample data
npm run seed
```

## 🔧 Development Scripts

```bash
npm run dev              # Start both frontend and backend concurrently
npm run dev:frontend     # Start frontend only (Vite dev server)
npm run dev:backend      # Start backend only (Node.js with nodemon)
npm run build            # Build frontend for production
npm run lint             # Run ESLint on the codebase
npm run lint:error       # Run ESLint with error-only mode
npm run preview          # Preview production build locally
npm run install:backend  # Install backend dependencies
npm run seed             # Seed database with sample data
```

## 📁 Project Structure

```
SprintRewards/
├── src/                          # Frontend (React)
│   ├── pages/                    # Page components
│   │   ├── Dashboard.jsx         # Main dashboard
│   │   ├── Leaderboard.jsx       # Leaderboard view
│   │   ├── Transactions.jsx      # Transaction history
│   │   ├── AdminPanel.jsx        # Admin management
│   │   ├── CommunityAdmin.jsx    # Community management
│   │   ├── Login.jsx             # OTP login page
│   │   ├── OTPVerification.jsx   # OTP verification
│   │   ├── CreateCommunity.jsx   # Create community
│   │   └── SwitchCommunity.jsx   # Switch communities
│   ├── components/               # Reusable components
│   ├── contexts/                 # React Context (Auth, Theme)
│   ├── api/                      # API configuration
│   └── theme.css                 # Theme variables
├── backend/                      # Backend (Node.js/Express)
│   ├── routes/                   # API routes
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── users.js              # User management
│   │   ├── sprints.js            # Sprint management
│   │   ├── transactions.js       # Point transfers
│   │   ├── communities.js        # Community management
│   │   └── uploads.js            # File uploads (S3)
│   ├── models/                   # MongoDB schemas
│   │   ├── User.js
│   │   ├── Sprint.js
│   │   ├── Transaction.js
│   │   ├── Community.js
│   │   ├── OTP.js
│   │   └── Invitation.js
│   ├── services/                 # Business logic
│   │   ├── emailService.js       # OTP email sending
│   │   ├── sprintService.js      # Sprint logic
│   │   └── cronJobs.js           # Scheduled tasks
│   ├── middleware/               # Express middleware
│   ├── server.js                 # Express app setup
│   └── package.json
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

## 📈 Analytics & Monitoring

The system provides comprehensive analytics:
- Community engagement metrics
- Point distribution patterns
- Sprint participation rates
- Transaction volume trends
- Leaderboard rankings
- Member activity tracking

## 🚀 Deployment Guide

### Prerequisites for Deployment
- MongoDB Atlas account (or self-hosted MongoDB)
- AWS account with SES service enabled
- AWS S3 bucket (optional, for community logos)
- Hosting platform account

### Frontend Deployment

**Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Option 2: Netlify**
```bash
# Build the app
npm run build

# Deploy the dist folder to Netlify
```

**Option 3: AWS S3 + CloudFront**
```bash
# Build the app
npm run build

# Upload dist folder to S3
# Configure CloudFront distribution
```

### Backend Deployment

**Option 1: Railway**
1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

**Option 2: Render**
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy

**Option 3: Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... set other variables

# Deploy
git push heroku main
```

**Option 4: AWS EC2 / DigitalOcean**
1. SSH into your server
2. Install Node.js and MongoDB
3. Clone repository
4. Install dependencies
5. Set environment variables
6. Use PM2 for process management
7. Configure Nginx as reverse proxy

### Database Deployment

**MongoDB Atlas (Recommended)**
1. Create account at mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to `MONGODB_URI` in `.env`

**Self-Hosted MongoDB**
- Docker: `docker run -d -p 27017:27017 mongo`
- Local installation: Follow MongoDB installation guide
- Update `MONGODB_URI` accordingly

### Environment Variables for Production

```env
# Server
PORT=3001
NODE_ENV=production
BACKEND_URL=https://your-api-domain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bravo-rewards

# Security
JWT_SECRET=your-very-secure-random-string-min-32-chars

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_production_key
AWS_SECRET_ACCESS_KEY=your_production_secret
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# S3 (optional)
S3_BUCKET_NAME=your-production-bucket
S3_PUBLIC_BASE_URL=https://your-bucket.s3.region.amazonaws.com

# OTP
OTP_EXPIRY_MINUTES=10
```

### SSL/HTTPS Configuration
- Use Let's Encrypt for free SSL certificates
- Configure Nginx/Apache as reverse proxy
- Redirect all HTTP traffic to HTTPS

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secret**: Use a strong, random string (min 32 characters) in production
3. **CORS**: Configure CORS to only allow your frontend domain
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: All user inputs are validated on backend
6. **Password Hashing**: Passwords are hashed using bcryptjs
7. **HTTPS**: Always use HTTPS in production
8. **AWS Credentials**: Use IAM roles instead of hardcoded credentials when possible

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If using MongoDB Atlas, verify:
# 1. Connection string is correct
# 2. IP address is whitelisted
# 3. Database user has correct permissions
```

### OTP Emails Not Sending
```bash
# Verify AWS SES configuration:
# 1. AWS credentials are correct
# 2. SES is enabled in your AWS region
# 3. Email address is verified in SES
# 4. Check AWS SES sending limits
```

### Port Already in Use
```bash
# Change port in .env
PORT=3002

# Or kill process using the port
# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :3001
kill -9 <PID>
```

### Frontend Not Connecting to Backend
```bash
# Verify backend is running on correct port
# Check BACKEND_URL in frontend configuration
# Ensure CORS is enabled in backend
# Check browser console for errors
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/request-otp` - Request OTP for email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user info

### User Endpoints
- `GET /api/users` - Get all users (with communityId query)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/leaderboard` - Get leaderboard data

### Transaction Endpoints
- `POST /api/transactions/send` - Send points to another user
- `GET /api/transactions/history` - Get user's transaction history
- `GET /api/transactions/all` - Get all transactions (admin only)

### Sprint Endpoints
- `GET /api/sprints/current` - Get current sprint
- `GET /api/sprints` - Get all sprints (admin only)
- `POST /api/sprints` - Create new sprint (admin only)

### Community Endpoints
- `GET /api/communities` - Get user's communities
- `POST /api/communities` - Create new community
- `GET /api/communities/:id` - Get community details
- `GET /api/communities/:id/members` - Get community members
- `POST /api/communities/:id/invite` - Invite member to community

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Contact

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in this README

## 🔄 Changelog

### Version 1.0.0
- Initial release
- OTP-based authentication with AWS SES
- Sprint-based point system
- Peer-to-peer point recognition
- Multi-community support
- Real-time leaderboards
- Admin panel and community management
- Transaction history and audit trail
- Theme system with 5 themes
- Responsive design for all devices

---

Built with ❤️ for internal employee recognition and motivation.