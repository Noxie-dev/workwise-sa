import express from 'express';
import { aiService } from '../services/aiService';

const router = express.Router();

/**
 * @route POST /api/ai/greet
 * @desc Generate a greeting using AI
 * @access Public
 */
router.post('/greet', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const response = await aiService.greet(name);
    res.json({ message: response });
  } catch (error) {
    console.error('Error in greet endpoint:', error);
    res.status(500).json({ error: 'Failed to generate greeting' });
  }
});

/**
 * @route POST /api/ai/generate
 * @desc Generate a response using AI
 * @access Public
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await aiService.generateResponse(prompt);
    res.json({ message: response });
  } catch (error) {
    console.error('Error in generate endpoint:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router; 