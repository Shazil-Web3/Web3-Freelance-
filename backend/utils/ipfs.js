const { create } = require('ipfs-http-client');

// Connect to a public IPFS node (can be customized)
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

async function uploadToIPFS(fileBuffer) {
  const { cid } = await ipfs.add(fileBuffer);
  return `https://ipfs.io/ipfs/${cid.toString()}`;
}

module.exports = { uploadToIPFS }; 