# SprintRewards - Employee Recognition & Reward System

A comprehensive employee recognition system that motivates team members through sprint-based point unlocking and peer-to-peer appreciation.

## 🌟 Features

- **Sprint-based Point System**: Employees earn sprint points and unlock reward points
- **AI Eligibility Validation**: AI checks task completion for fair point distribution
- **Weekend Unlock Window**: Points can only be unlocked on weekends
- **Peer-to-Peer Recognition**: Send points to colleagues with optional messages
- **Real-time Leaderboards**: Track top givers and receivers
- **Admin Dashboard**: Founder controls for employee management
- **Task Management**: Track sprint tasks and progress
- **Transaction History**: Complete audit trail of all point transfers

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sprintrewards
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   npm run install:backend
   ```

4. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers.

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

## 📱 User Roles

### Employee Features
- View sprint progress (12-point scale)
- Track eligibility status for point unlocking
- Unlock 500 reward points on weekends (if eligible)
- Send points to other employees with messages
- View transaction history and leaderboards
- Manage personal tasks and track completion

### Founder Features
- Add, edit, and remove employees
- View all employee data and sprint progress
- Monitor AI eligibility reports
- Access complete transaction logs
- Manual point adjustments and sprint controls
- System-wide analytics and insights

## 🤖 AI Validation System

The AI module evaluates employee performance based on:
- Task completion rate
- Quality of work submissions
- Sprint consistency and engagement
- Detection of duplicate or invalid entries

**AI Output Example:**
```json
{
  "isEligible": true,
  "confidenceScore": 92,
  "remarks": "High completion rate with consistent updates."
}
```

## 📊 Sprint Cycle

1. **Sprint Start**: Employees begin with 12 sprint points
2. **Task Management**: Create and track tasks throughout the sprint
3. **AI Evaluation**: Friday midnight - AI analyzes performance
4. **Weekend Unlock**: Eligible employees can unlock 500 points (Sat-Sun only)
5. **Sprint Reset**: Monday morning - New sprint cycle begins

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

## 🧪 Demo Accounts

For testing purposes:

**Founder Account:**
- Email: founder@example.com
- Password: password123

**Employee Account:**
- Email: employee@example.com
- Password: password123

## 🔧 Configuration

### Environment Variables
```env
# Backend Configuration
PORT=3001
MONGODB_URI=mongodb://localhost:27017/sprintrewards
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key
```

### Development Scripts
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build           # Build for production
npm run preview         # Preview production build
```

## 📈 Monitoring & Analytics

The system provides comprehensive analytics:
- Employee engagement metrics
- Point distribution patterns
- Sprint completion rates
- AI validation accuracy
- Transaction volume trends

## 🚀 Deployment

### Frontend Deployment
The React app can be deployed to:
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Backend Deployment
The Node.js backend can be deployed to:
- Railway
- Render
- Heroku
- AWS EC2
- DigitalOcean Droplets

### Database Options
- MongoDB Atlas (cloud)
- Local MongoDB instance
- Docker container

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Core sprint and reward system
- AI-based eligibility validation
- Admin panel and employee management
- Real-time leaderboards
- Task management system
- Complete transaction history

---

Built with ❤️ by the QuestLabs team for internal employee recognition and motivation.