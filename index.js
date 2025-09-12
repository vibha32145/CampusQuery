dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import fileRoutes from './routes/fileRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';

import { chatting } from './controllers/chatController.js'; //GEmini wallah
import { chattingGPT } from './controllers/chatControllerGpt.js'; //GPT wallah

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;



// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Admin/file upload routes
app.use('/api/files', fileRoutes);



// Chat route (preserved)
app.post('/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  try {
    const answer = await chattingGPT(question);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});