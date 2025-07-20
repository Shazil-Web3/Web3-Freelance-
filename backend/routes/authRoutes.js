const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Get nonce for wallet
router.get('/nonce/:wallet', authController.getNonce);
// Verify signature and authenticate
router.post('/verify', authController.verifySignature);

module.exports = router; 