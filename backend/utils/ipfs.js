const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mock IPFS implementation for development
// In production, replace this with actual IPFS integration
async function uploadToIPFS(fileBuffer) {
  try {
    console.log('Mock IPFS: Attempting to upload file...');
    console.log('File buffer size:', fileBuffer.length);
    
    // Generate a unique hash for the file (simulating IPFS CID)
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const mockCid = `Qm${hash.substring(0, 44)}`; // Mock IPFS CID format
    
    // Save file locally (simulating IPFS storage)
    const fileName = `${mockCid}.bin`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    
    console.log('Mock IPFS upload successful:', mockCid);
    console.log('File saved locally at:', filePath);
    
    return mockCid;
  } catch (error) {
    console.error('Mock IPFS upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
}

// Alternative real IPFS implementation (commented out for now)
/*
const { create } = require('ipfs-http-client');
const ipfs = create({ 
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

async function uploadToIPFS(fileBuffer) {
  try {
    const result = await ipfs.add(fileBuffer);
    return result.cid.toString();
  } catch (error) {
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}
*/

function getIpfsUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

module.exports = { uploadToIPFS, getIpfsUrl }; 