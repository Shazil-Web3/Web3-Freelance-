const express = require('express');
const multer = require('multer');
const router = express.Router();
const projectSubmissionController = require('../controllers/projectSubmissionController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const allowedExtensions = [
  '.jpeg', '.jpg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.mp4', '.mov'
];
const allowedMimeTypes = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'application/zip', 'application/x-rar-compressed',
  'video/mp4', 'video/quicktime'
];
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    const mimetype = file.mimetype;
    console.log('UPLOAD DEBUG: ext', ext, 'mimetype', mimetype);
    if (
      allowedExtensions.map(e => e.toLowerCase()).includes(ext) ||
      allowedMimeTypes.includes(mimetype)
    ) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type: ' + ext + ' ' + mimetype));
    }
  }
});

// Upload project files (freelancer)
router.post('/:jobId/upload', authenticateJWT, upload.array('files', 10), projectSubmissionController.uploadProjectFiles);

// Mark project as complete (freelancer)
router.patch('/:jobId/complete', authenticateJWT, projectSubmissionController.markProjectComplete);

// Approve project (client)
router.patch('/:jobId/approve', authenticateJWT, projectSubmissionController.approveProject);

// Get project submission details
router.get('/:jobId', authenticateJWT, projectSubmissionController.getProjectSubmission);

module.exports = router;
