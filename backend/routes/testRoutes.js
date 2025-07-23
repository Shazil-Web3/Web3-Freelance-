const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadToIPFS, getIpfsUrl } = require('../utils/ipfs');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Test IPFS upload endpoint
router.post('/upload', upload.single('testFile'), async (req, res) => {
  try {
    console.log('Test upload endpoint hit');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Upload to IPFS
    const ipfsHash = await uploadToIPFS(req.file.buffer);
    const ipfsUrl = getIpfsUrl(ipfsHash);

    console.log('Upload successful:', { ipfsHash, ipfsUrl });

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.originalname,
      size: req.file.size,
      ipfsHash,
      ipfsUrl
    });

  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ 
      message: 'Upload failed', 
      error: error.message 
    });
  }
});

// Test endpoint
router.get('/health', (req, res) => {
  res.json({ message: 'Test routes working', timestamp: new Date().toISOString() });
});

module.exports = router;
