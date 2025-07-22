const { ethers } = require('ethers');

function verifySignature(address, signature, nonce) {
  const message = `Sign this nonce to authenticate: ${nonce}`;
  // ethers v6: verifyMessage is a top-level export, not under ethers.utils
  const recovered = ethers.verifyMessage(message, signature);
  return recovered.toLowerCase() === address.toLowerCase();
}

module.exports = { verifySignature }; 