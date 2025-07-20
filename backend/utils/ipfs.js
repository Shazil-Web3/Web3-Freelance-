const { create } = require('ipfs-http-client');

// Connect to a public IPFS node (can be customized)
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

async function uploadToIPFS(fileBuffer) {
  const { cid } = await ipfs.add(fileBuffer);
  return cid.toString(); // Return only the hash for smart contract
}

function getIpfsUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

module.exports = { uploadToIPFS, getIpfsUrl }; 