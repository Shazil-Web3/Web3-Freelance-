const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Create job
router.post('/', authenticateJWT, jobController.createJob);
// List jobs
router.get('/', jobController.listJobs);
// Get job by ID
router.get('/:id', jobController.getJob);
// Update job
router.put('/:id', authenticateJWT, jobController.updateJob);
// Delete job
router.delete('/:id', authenticateJWT, jobController.deleteJob);
// Update job status
router.patch('/:id/status', authenticateJWT, jobController.updateJobStatus);

module.exports = router; 