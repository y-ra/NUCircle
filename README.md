# NUCircle

**NUCircle** is a comprehensive Q&A and community platform designed specifically for Northeastern University students. Built as a modern alternative to Stack Overflow, NUCircle enables Huskies to ask questions, share knowledge, connect with peers, and engage in collaborative learning through real-time multiplayer games.

## 🌟 Features

### Core Q&A Platform
- **Questions & Answers**: Post questions, provide answers, and engage in discussions
- **Voting System**: Upvote/downvote questions and answers to highlight quality content
- **Comments**: Add comments to questions and answers for clarifications
- **Tags**: Organize content with tags and filter by topics
- **Search**: Powerful search functionality to find questions by keywords or tags

### Community & Social
- **User Profiles**: Comprehensive profiles with biography, major, graduation year, and career goals
- **Badges & Points**: Gamified reputation system with badges and points for contributions
- **Work Experience**: Showcase co-op experiences and professional background
- **Communities**: Create and join communities based on interests, majors, or topics
- **Community Messages**: Post messages and announcements within communities
- **Direct Messaging**: Real-time one-on-one and group chat functionality
- **User Search**: Find and connect with other Northeastern students

### Collections & Organization
- **Collections**: Save and organize favorite questions into custom collections
- **Personal Library**: Build a personal knowledge base of saved content

### Real-Time Multiplayer Games
- **Trivia Quiz**: Challenge fellow students to real-time multiplayer trivia games
  - 10-question rounds with instant scoring
  - Tiebreaker rounds for tied games
  - Real-time game updates via WebSocket
  - Points awarded based on performance
- **Game Invitations**: Send and receive quiz challenges from other users
- **Game History**: Track your gaming statistics and achievements

### Technical Features
- **Real-Time Updates**: Socket.IO-powered real-time notifications and updates
- **Online Status**: See who's online and available for chat or games
- **Responsive Design**: Modern, mobile-friendly UI built with React
- **RESTful API**: Well-documented API with OpenAPI/Swagger specification
- **Type Safety**: Full TypeScript implementation across client and server

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 19 with TypeScript
- Vite for build tooling
- React Router for navigation
- Socket.IO Client for real-time communication
- Lucide React for icons

**Backend**
- Node.js with Express
- TypeScript
- MongoDB with Mongoose ODM
- Socket.IO for WebSocket communication
- JWT for authentication
- OpenAPI validation middleware

**Testing**
- Jest for unit and integration tests
- Cypress for end-to-end testing
- Stryker for mutation testing

**Development Tools**
- ESLint + Prettier for code quality
- TypeScript for type safety
- Shared types package for consistency

### Project Structure
├── client/ # React frontend application
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── hooks/ # Custom React hooks
│ │ ├── services/ # API service layer
│ │ └── types/ # TypeScript types
│ └── package.json
│
├── server/ # Express backend application
│ ├── controllers/ # API route handlers
│ ├── services/ # Business logic
│ ├── models/ # Mongoose schemas and models
│ ├── middleware/ # Express middleware
│ ├── tests/ # Jest test suites
│ └── package.json
│
├── shared/ # Shared TypeScript types
│ └── types/ # Common type definitions
│
└── testing/ # Cypress E2E tests
└── cypress/
## 🚀 Getting Started### 
Prerequisites- Node.js (v18 or higher)- MongoDB (running locally or connection string)- npm or yarn

### Installation

1. **Clone the repository**   
git clone https://github.com/neu-cs4530/fall25-project-m-a-r-t-514.git   
cd fall25-project-m-a-r-t-514

2. **Install dependencies**
npm install
This installs dependencies for all workspaces (client, server, shared).

3. **Set up environment variables**
Create a `.env` file in the `server/` directory:
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://127.0.0.1:27017

4. **Set up the database**
Populate the database with seed data:
cd server
npm run populate-db

### Running the Application

1. **Start the backend server**
cd server
npm run dev
Server runs on `http://localhost:8000`

2. **Start the frontend client**
(in a new terminal)
cd client
npm run dev
Client runs on `http://localhost:5173`

3. **Access the application**
- Open `http://localhost:5173` in your browser
- API documentation available at `http://localhost:8000/api/docs`

This installs dependencies for all workspaces (client, server, shared).
Set up environment variables
Create a .env file in the server/ directory:
   JWT_SECRET=your-secret-key-here   MONGODB_URI=mongodb://127.0.0.1:27017s. Features real-time multiplayer trivia games, direct messaging, communities, question collections, and a comprehensive reputation system. Built with React, TypeScript, Express, MongoDB, and Socket.IO.
Set up the database
Populate the database with seed data:
   cd server   npm run populate-db
Running the Application
Start the backend server
   cd server   npm run dev
Server runs on http://localhost:8000
Start the frontend client (in a new terminal)
   cd client   npm run dev
Client runs on http://localhost:5173
Access the application
Open http://localhost:5173 in your browser
API documentation available at http://localhost:8000/api/docs
📚 API Documentation
The API is fully documented using OpenAPI 3.1 specification. Access the interactive Swagger UI at:
http://localhost:8000/api/docs
Key API Endpoints
Questions: /api/question/* - Get, create, and vote on questions
Answers: /api/answer/* - Add answers to questions
Comments: /api/comment/* - Add comments
Users: /api/user/* - User management and authentication
Chat: /api/chat/* - Direct messaging and chat rooms
Games: /api/games/* - Game creation and management
Communities: /api/community/* - Community features
Collections: /api/collection/* - Question collections
🧪 Testing
Unit Tests (Jest)
Run server-side unit tests:
cd servernpm test
Run with coverage:
cd servernpm test -- --coverage
End-to-End Tests (Cypress)
Ensure both client and server are running
Navigate to the testing directory:
   cd testing   npm install
Run Cypress:
   npx cypress open
🎮 Game Features
Trivia Quiz Game
The trivia game is a real-time multiplayer experience:
Challenge a Player: Click "Challenge" on any user's profile
Accept Invitation: Recipient receives a real-time invitation notification
Play: Both players answer 10 questions simultaneously
Tiebreaker: If scores are tied, a tiebreaker question determines the winner
Scoring: Winners earn 10 points, losers earn 2 points
Game States
WAITING_TO_START: Game created, waiting for players
IN_PROGRESS: Game active, players answering questions
OVER: Game completed, winner determined
👥 User Features
Profile Customization
Biography and personal information
Academic details (major, graduation year)
Career goals and co-op interests
Technical interests
External links (LinkedIn, GitHub, Portfolio)
Work experience showcase
Reputation System
Points earned through:
Answering questions correctly
Winning trivia games
Community contributions
Badges for various achievements
Public/private stats toggle
🔒 Security
JWT-based authentication
Password hashing with bcrypt
Input validation via OpenAPI middleware
Socket.IO authentication
Protected routes and API endpoints
📝 Database Schema
The application uses MongoDB with the following main collections:
User: User accounts and profiles
Question: Questions posted by users
Answer: Answers to questions
Comment: Comments on questions/answers
Tag: Tags for categorizing content
Chat: Chat rooms and messages
Community: User communities
Collection: User question collections
Game: Game instances
TriviaQuestion: Trivia quiz questions
See server/models/schema/ for detailed schema definitions.
🤝 Contributing
This is a class project for CS 4530 at Northeastern University. Contributions follow the course guidelines and team collaboration practices.
📄 License
ISC License
🙏 Acknowledgments
Built as part of CS 4530 (Software Engineering) at Northeastern University. Inspired by Stack Overflow, designed specifically for the Northeastern community.
