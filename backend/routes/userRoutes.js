const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get user profile by wallet address
router.get('/:wallet', userController.getProfile);
// Update user profile
router.put('/:wallet', userController.updateProfile);
// Get dashboard data for user
router.get('/:wallet/dashboard', userController.getDashboard);

module.exports = router; 