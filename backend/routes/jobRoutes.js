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
// People Hired (freelancers hired by client)
router.get('/people-hired', jobController.peopleHired);
// Ongoing/Completed Projects for Client
router.get('/ongoing/client', jobController.ongoingProjectsClient);
router.get('/completed/client', jobController.completedProjectsClient);
// Ongoing/Completed Projects for Freelancer
router.get('/ongoing/freelancer', jobController.ongoingProjectsFreelancer);
router.get('/completed/freelancer', jobController.completedProjectsFreelancer);

module.exports = router; 