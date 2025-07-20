const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Complete milestone (freelancer)
router.post('/complete', authenticateJWT, milestoneController.completeMilestone);
// Approve milestone (client)
router.post('/approve', authenticateJWT, milestoneController.approveMilestone);

module.exports = router; 