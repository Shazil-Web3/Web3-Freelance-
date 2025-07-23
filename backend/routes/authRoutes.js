const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Get nonce for wallet
router.get('/nonce/:wallet', authController.getNonce);
// Verify signature and authenticate
router.post('/verify', authController.verifySignature);
// Validate JWT token
router.post('/verify-token', authController.verifyToken);

module.exports = router; 