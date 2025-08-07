const { ethers } = require('ethers');
require('dotenv').config();

// Test script to check dispute resolver status for a specific address
async function testDisputeResolver() {
  try {
    // Configuration
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
    const TEST_ADDRESS = '0x39CEE3E30cB32ce23CD3653D6f4d77155A4Fc35e'; // The dispute resolver address
    
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

    console.log('=== Testing Dispute Resolver Status ===');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Test Address:', TEST_ADDRESS);
    console.log('Test Address (lowercase):', TEST_ADDRESS.toLowerCase());

    // Test with original case
    const isResolverOriginal = await contract.disputeResolvers(TEST_ADDRESS);
    console.log('Is Dispute Resolver (original case):', isResolverOriginal);

    // Test with lowercase
    const isResolverLower = await contract.disputeResolvers(TEST_ADDRESS.toLowerCase());
    console.log('Is Dispute Resolver (lowercase):', isResolverLower);

    // Test with checksum address
    const checksumAddress = ethers.getAddress(TEST_ADDRESS);
    console.log('Checksum Address:', checksumAddress);
    const isResolverChecksum = await contract.disputeResolvers(checksumAddress);
    console.log('Is Dispute Resolver (checksum):', isResolverChecksum);

    // Get contract owner
    const owner = await contract.owner();
    console.log('Contract Owner:', owner);

    console.log('\n=== Summary ===');
    if (isResolverOriginal || isResolverLower || isResolverChecksum) {
      console.log('✅ Address IS recognized as dispute resolver');
    } else {
      console.log('❌ Address is NOT recognized as dispute resolver');
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
testDisputeResolver()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 