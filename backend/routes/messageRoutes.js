const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Send message
router.post('/', authenticateJWT, messageController.sendMessage);
// List messages for a job
router.get('/:jobId', authenticateJWT, messageController.listMessages);

module.exports = router; 