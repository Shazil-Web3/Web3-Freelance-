const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');
const { authenticateJWT } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file to IPFS
router.post('/upload', authenticateJWT, upload.single('file'), fileController.uploadFile);

module.exports = router; 