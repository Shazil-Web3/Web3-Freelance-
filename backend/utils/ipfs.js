const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const PINATA_JWT = process.env.PINATA_JWT;

async function uploadToIPFS(fileBuffer) {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT is not set in environment variables');
    }

    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'upload.bin',
      contentType: 'application/octet-stream',
    });

    const response = await axios.post(url, formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    if (response.data && response.data.IpfsHash) {
      return response.data.IpfsHash;
    } else {
      throw new Error('Invalid response from Pinata: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('Pinata IPFS upload error:', error);
    throw new Error(`Pinata IPFS upload failed: ${error.message}`);
  }
}

function getIpfsUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

module.exports = { uploadToIPFS, getIpfsUrl }; 