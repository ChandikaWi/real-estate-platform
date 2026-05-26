import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Load environment variables first
dotenv.config();

// Connect to the MongoDB database
connectDB();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running and database is connected...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});