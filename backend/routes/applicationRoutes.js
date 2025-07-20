const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Apply to job
router.post('/apply', authenticateJWT, applicationController.applyToJob);
// List applications for a job
router.get('/job/:jobId', applicationController.listForJob);
// List applications by freelancer
router.get('/freelancer', authenticateJWT, applicationController.listForFreelancer);
// Accept/reject application
router.patch('/:id/status', authenticateJWT, applicationController.updateStatus);
// Withdraw application
router.patch('/:id/withdraw', authenticateJWT, applicationController.withdraw);

module.exports = router; 