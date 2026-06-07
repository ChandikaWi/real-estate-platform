import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React frontend URL
    methods: ["GET", "POST"]
  }
});

// Make 'io' globally accessible to my API controllers
app.set('io', io);

// Socket Connection Logic
io.on('connection', (socket) => {
  console.log(`Connected to Socket: ${socket.id}`);

  // Create a private room for the logged-in user based on their MongoDB ID
  socket.on('setup', (userData) => {
    if (userData && userData._id) {
      socket.join(userData._id);
      console.log(`User joined room: ${userData._id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from Socket');
  });
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));