const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Create review
router.post('/', authenticateJWT, reviewController.createReview);
// List reviews for a user
router.get('/:userId', reviewController.listForUser);

module.exports = router; 