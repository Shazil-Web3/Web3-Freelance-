const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Create notification
router.post('/', authenticateJWT, notificationController.createNotification);
// List notifications for user
router.get('/', authenticateJWT, notificationController.listNotifications);
// Mark as read
router.patch('/:id/read', authenticateJWT, notificationController.markAsRead);

module.exports = router; 