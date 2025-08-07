const express = require('express');
const multer = require('multer');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Configure multer for evidence uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Create a new dispute
router.post('/create', authenticateJWT, disputeController.createDispute);

// Dispute resolver routes - MUST come before parameterized routes
// Check if user is dispute resolver
router.get('/resolver/check', authenticateJWT, disputeController.checkDisputeResolver);

// Get all disputes (for dispute resolvers)
router.get('/resolver/all', authenticateJWT, disputeController.getAllDisputes);

// Upload evidence for a dispute
router.post('/:disputeId/evidence', authenticateJWT, upload.array('files', 5), disputeController.uploadEvidence);

// Get dispute details
router.get('/:disputeId', authenticateJWT, disputeController.getDisputeDetails);

// Get all disputes for a user
router.get('/user/all', authenticateJWT, disputeController.getUserDisputes);

// Get disputes for a specific job
router.get('/job/:jobId', authenticateJWT, disputeController.getJobDisputes);

// Resolve dispute (dispute resolver)
router.post('/:disputeId/resolve', authenticateJWT, disputeController.resolveDispute);

// Cancel project (dispute resolver)
router.post('/:disputeId/cancel', authenticateJWT, disputeController.cancelProject);

module.exports = router;
