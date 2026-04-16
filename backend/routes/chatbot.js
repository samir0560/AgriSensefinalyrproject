// Chatbot Routes
const express = require('express');
const router = express.Router();
const { getChatResponse, getChatHistory } = require('../controllers/chatbotController');
const { optionalUser, protectUser } = require('../middleware/authUser');

// @route   POST /api/chatbot/message
// @desc    Get chatbot response to user message
// @access  Public (Bearer token optional — saves Q&A when present)
router.post('/message', optionalUser, getChatResponse);

// @route   GET /api/chatbot/history
// @desc    Saved chat turns for logged-in user
// @access  Private
router.get('/history', protectUser, getChatHistory);

module.exports = router;