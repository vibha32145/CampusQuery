import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { chatting } from './controllers/chatController.js'; //GEmini wallah
import { chattingGPT } from './controllers/chatControllerGpt.js'; //GPT wallah

dotenv.config();
const app = express();
app.use(cors()); // Allow all origins
app.use(express.json());



// Set up a POST route for chat
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
