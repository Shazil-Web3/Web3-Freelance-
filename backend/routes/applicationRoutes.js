const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Create application (POST /api/applications) - for frontend compatibility
router.post('/', authenticateJWT, applicationController.createApplication);
// Get applications by freelancer (GET /api/applications?freelancer=id)
router.get('/', applicationController.getApplications);
// Apply to job (legacy route)
router.post('/apply', authenticateJWT, applicationController.applyToJob);
// List applications for a job
router.get('/job/:jobId', applicationController.listForJob);
// List applications by freelancer
router.get('/freelancer', authenticateJWT, applicationController.listForFreelancer);
// Accept/reject application
router.patch('/:id/status', authenticateJWT, applicationController.updateStatus);
// Withdraw application
router.patch('/:id/withdraw', authenticateJWT, applicationController.withdraw);
// Applied Jobs for Freelancer (dashboard)
router.get('/applied', authenticateJWT, applicationController.appliedJobs);

module.exports = router; 