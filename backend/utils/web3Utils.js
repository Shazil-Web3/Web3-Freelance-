const { ethers } = require('ethers');

function verifySignature(address, signature, nonce) {
  const message = `Sign this nonce to authenticate: ${nonce}`;
  const recovered = ethers.utils.verifyMessage(message, signature);
  return recovered.toLowerCase() === address.toLowerCase();
}

module.exports = { verifySignature }; 