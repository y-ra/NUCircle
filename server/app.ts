/* eslint-disable no-console */
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
// startServer() is a function that starts the server
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import * as http from 'http';
import * as OpenApiValidator from 'express-openapi-validator';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import * as fs from 'fs';

import answerController from './controllers/answer.controller';
import questionController from './controllers/question.controller';
import tagController from './controllers/tag.controller';
import commentController from './controllers/comment.controller';
import { FakeSOSocket } from './types/types';
import userController from './controllers/user.controller';
import messageController from './controllers/message.controller';
import chatController from './controllers/chat.controller';
import gameController from './controllers/game.controller';
import collectionController from './controllers/collection.controller';
import communityController from './controllers/community.controller';
import { updateUserOnlineStatus, getUserByUsername } from './services/user.service';
import communityMessagesController from './controllers/communityMessagesController';
import badgeController from './controllers/badge.controller';
// import authMiddleware from './middleware/auth';
import authMiddleware from './middleware/auth';
import QuizInvitationManager from './services/invitationManager.service';
import GameManager from './services/games/gameManager';
import workExperienceController from './controllers/workExperience.controller';

const MONGO_URL = `${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'}/fake_so`;
const PORT = parseInt(process.env.PORT || '8000');

const app = express();
const server = http.createServer(app);
// allow requests from the local dev client or the production client only
const io: FakeSOSocket = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: process.env.CLIENT_URL || [
      'http://localhost:4530',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://fall25-project-m-a-r-t-514.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'], // Explicitly set transports
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000, // Increase timeout for slower connections
  pingInterval: 25000,
});

async function connectDatabase(retries = 3, delay = 2000) {
  const options = {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  };

  for (let attempt = 1; attempt <= retries; attempt = attempt + 1) {
    try {
      await mongoose.connect(MONGO_URL, options);
      console.log('✅ Successfully connected to MongoDB');
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error('\n❌ MongoDB connection failed after', retries, 'attempts');
        console.error('MongoDB connection error:', err instanceof Error ? err.message : err);
        console.error('\n⚠️  MongoDB is not available. Please ensure MongoDB is running.');
        console.error(`   Connection attempted to: ${MONGO_URL}`);
        console.error('\n📋 Setup Options:');
        console.error('   1. MongoDB Atlas (Cloud - Recommended):');
        console.error('      - Sign up at https://www.mongodb.com/cloud/atlas');
        console.error('      - Create a free cluster');
        console.error(
          '      - Get connection string and set: MONGODB_URI="your-connection-string"',
        );
        console.error('   2. Local MongoDB:');
        console.error('      - Install MongoDB: https://www.mongodb.com/try/download/community');
        console.error('      - Start MongoDB service: mongod');
        console.error('      - Or on Windows: net start MongoDB (if installed as service)');
        console.error('\n💡 Quick fix: Create a .env file in server/ directory with:');
        console.error('   MONGODB_URI="your-mongodb-connection-string"\n');
        throw err;
      } else {
        console.warn(
          `⚠️  MongoDB connection attempt ${attempt}/${retries} failed. Retrying in ${delay}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

async function startServer() {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

/**
 * Socket.IO connection handler
 *
 * Manages real-time communication between the server and clients
 * Handles the user online status, quiz invitations, and game disconnections.
 */
io.on('connection', socket => {
  // Listen for userConnect event: client sends this after successful login
  socket.on('userConnect', async (username: string) => {
    console.log(`User ${username} connected with socket ${socket.id}`);

    // Update the database: set user online, store their socket ID for real-time messaging
    const result = await updateUserOnlineStatus(username, true, socket.id);

    if ('error' in result) {
      socket.emit('error', { message: 'Failed to update online status' });
      return;
    }

    // Store username in socket instance
    socket.data.username = username;

    // Broadcast to all other clients
    socket.broadcast.emit('userStatusUpdate', {
      username,
      isOnline: true,
    });
  });

  /**
   * Event handler for sendQuizInvite
   * Triggered when the user clicks Challenge button on another user's profile
   * Sends quiz invitation to recipient if they are online
   */
  socket.on('sendQuizInvite', async (recipientUsername: string) => {
    const challengerUsername = socket.data.username;

    if (!challengerUsername) {
      socket.emit('error', { message: 'Recipient not found' });
      return;
    }

    // Check if user is online
    const recipientUser = await getUserByUsername(recipientUsername);
    if ('error' in recipientUser) {
      socket.emit('error', { message: 'Recipient not found' });
      return;
    }

    if (!recipientUser.isOnline || !recipientUser.socketId) {
      socket.emit('error', { message: 'Recipient is not online' });
      return;
    }

    const invitationManager = QuizInvitationManager.getInstance();

    // Prevent duplicate invitations
    if (invitationManager.hasPendingInvitation(recipientUsername, challengerUsername)) {
      socket.emit('error', { message: 'Invitation already sent' });
      return;
    }

    // Create invitation
    const invite = invitationManager.createInvitation(
      challengerUsername,
      socket.id,
      recipientUsername,
      recipientUser.socketId,
    );

    // Send invitation to recipient via their socket
    socket.to(recipientUser.socketId).emit('quizInviteReceived', invite);
  });

  // Respond to Invitation
  socket.on('respondToQuizInvite', async (inviteId: string, accepted: boolean) => {
    const invitationManager = QuizInvitationManager.getInstance();
    const invite = invitationManager.getInvitation(inviteId);

    if (!invite) {
      socket.emit('error', { message: 'Invitation not found or expired' });
      return;
    }

    // Response object to send to both players
    const result: {
      inviteId: string;
      challengerUsername: string;
      recipientUsername: string;
      accepted: boolean;
      gameId?: string;
    } = {
      inviteId: invite.id,
      challengerUsername: invite.challengerUsername,
      recipientUsername: invite.recipientUsername,
      accepted,
    };

    if (accepted) {
      // Create a new trivia game
      const gameManager = GameManager.getInstance();
      const gameIdResult = await gameManager.addGame('Trivia', invite.challengerUsername);

      if (typeof gameIdResult === 'string') {
        // Game created successfully
        const gameId = gameIdResult;

        // Join both players to the game
        await gameManager.joinGame(gameId, invite.challengerUsername);
        await gameManager.joinGame(gameId, invite.recipientUsername);

        // Start the game
        await gameManager.startGame(gameId);

        result.gameId = gameId;

        // Update invitation status
        invitationManager.updateInvitationStatus(inviteId, 'accepted');

        // Notify both players with gameId
        io.to(invite.challengerSocketId).emit('quizInviteAccepted', result);
        io.to(invite.recipientSocketId).emit('quizInviteAccepted', result);
      } else {
        socket.emit('error', { message: 'Failed to create game' });
        return;
      }
    } else {
      // Invitation declined
      invitationManager.updateInvitationStatus(inviteId, 'declined');

      // Notify both users
      io.to(invite.challengerSocketId).emit('quizInviteDeclined', result);
      io.to(invite.recipientSocketId).emit('quizInviteDeclined', result);
    }

    // Clean up invitation from memory
    invitationManager.removeInvitation(inviteId);
  });

  // Listen for disconnect event: when user logs out, closes browser, or loses connection
  socket.on('disconnect', async () => {
    const username = socket.data.username;

    if (username) {
      const gameManager = GameManager.getInstance();
      const userGames = await gameManager.getGamesByPlayer(username);

      for (const game of userGames) {
        if (game.state.status === 'IN_PROGRESS' || game.state.status === 'WAITING_TO_START') {
          const otherPlayer = game.players.find(p => p !== username);

          if (otherPlayer) {
            await gameManager.endGameByDisconnect(game.gameID, username, otherPlayer);

            const otherUser = await getUserByUsername(otherPlayer);
            if (!('error' in otherUser) && otherUser.socketId) {
              // Get updated game state
              const updatedGame = gameManager.getGame(game.gameID);

              // Emit game update to show game over screen
              if (updatedGame) {
                io.to(otherUser.socketId).emit('gameUpdate', {
                  gameInstance: updatedGame.toModel(),
                });
              }

              // Also send disconnect notification (optional - for additional context)
              io.to(otherUser.socketId).emit('opponentDisconnected', {
                gameId: game.gameID,
                disconnectedPlayer: username,
                winner: otherPlayer,
                message: `${username} disconnected. You win by default!`,
              });
            }
          }
        }
      }

      const result = await updateUserOnlineStatus(username, false, null);
      if ('error' in result) {
        return;
      }

      socket.broadcast.emit('userStatusUpdate', {
        username,
        isOnline: false,
        lastSeen: new Date(),
      });
    }
  });
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  io.close();

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

app.use(express.json());

try {
  app.use(
    OpenApiValidator.middleware({
      apiSpec: './openapi.yaml',
      validateRequests: true,
      validateResponses: false, // FOR DEVELOPMENT ONLY - set to true in production
      ignoreUndocumented: true, // Only validate paths defined in the spec
      formats: {
        'object-id': (v: string) => /^[0-9a-fA-F]{24}$/.test(v),
      },
    }),
  );

  // Custom Error Handler for express-openapi-validator errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Format error response for validation errors
    if (err.status && err.errors) {
      res.status(err.status).json({
        message: 'Request Validation Failed',
        errors: err.errors,
      });
    } else {
      next(err); // Pass through other errors
    }
  });
} catch (e) {
  console.error('Failed to load or initialize OpenAPI Validator:', e);
}

app.use('/api/user', userController(io));

const openApiDocument = yaml.parse(fs.readFileSync('./openapi.yaml', 'utf8'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
console.log('Swagger UI is available at /api/docs');

app.use(authMiddleware); // Protect routes below this line

app.use('/api/question', questionController(io));
app.use('/api/tags', tagController());
app.use('/api/answer', answerController(io));
app.use('/api/comment', commentController(io));
app.use('/api/message', messageController(io));
app.use('/api/chat', chatController(io));
app.use('/api/games', gameController(io));
app.use('/api/collection', collectionController(io));
app.use('/api/community', communityController(io));
app.use('/api/community/messages', communityMessagesController(io));
app.use('/api/badge', badgeController(io));
app.use('/api/work', workExperienceController(io));

// Export the app instance
export { app, server, startServer };
