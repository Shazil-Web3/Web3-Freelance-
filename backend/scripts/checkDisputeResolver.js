const { ethers } = require('ethers');
require('dotenv').config();

// Script to check dispute resolver status
async function checkDisputeResolver() {
  try {
    // Configuration
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
    const DISPUTE_RESOLVER_ADDRESS = '0x39CEE3E30cB32ce23CD3653D6f4d77155A4Fc35e';
    
    if (!CONTRACT_ADDRESS) {
      console.error('Missing required environment variable: CONTRACT_ADDRESS');
      process.exit(1);
    }

    // Contract ABI - just the functions we need
    const CONTRACT_ABI = [
      "function disputeResolvers(address) view returns (bool)",
      "function owner() view returns (address)"
    ];

    // Connect to the blockchain (read-only)
    const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia/6058e85189582de0fc7676b117ba4e4223a386651c25edfedd4d3822e240336f');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log('=== Checking Dispute Resolver Status ===');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Dispute Resolver Address:', DISPUTE_RESOLVER_ADDRESS);

    // Check current status
    const isResolver = await contract.disputeResolvers(DISPUTE_RESOLVER_ADDRESS);
    console.log('Is Dispute Resolver:', isResolver);

    // Get contract owner
    const owner = await contract.owner();
    console.log('Contract Owner:', owner);

    if (isResolver) {
      console.log('✅ Dispute resolver is already assigned and active');
    } else {
      console.log('❌ Dispute resolver is NOT assigned');
      console.log('');
      console.log('To assign the dispute resolver, you need to:');
      console.log('1. Set OWNER_PRIVATE_KEY in your .env file');
      console.log('2. Run: node scripts/assignDisputeResolver.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    process.exit(1);
  }
}

// Run the script
checkDisputeResolver()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 