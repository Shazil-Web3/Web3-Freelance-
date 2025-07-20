const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Get admin stats
router.get('/stats', authenticateJWT, adminController.getStats);
// Flag/report abuse
router.post('/flag', authenticateJWT, adminController.flagAbuse);

module.exports = router; 