const { ethers } = require('ethers');
require('dotenv').config();

// Script to assign dispute resolver role
async function assignDisputeResolver() {
  try {
    // Configuration
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
    const PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY; // Owner's private key
    const DISPUTE_RESOLVER_ADDRESS = '0x39CEE3E30cB32ce23CD3653D6f4d77155A4Fc35e'; // The dispute resolver address
    
    if (!CONTRACT_ADDRESS || !PRIVATE_KEY) {
      console.error('Missing required environment variables: CONTRACT_ADDRESS or OWNER_PRIVATE_KEY');
      process.exit(1);
    }

    // Contract ABI - just the functions we need
    const CONTRACT_ABI = [
      "function assignDisputeResolver(address user, bool status) external",
      "function disputeResolvers(address) view returns (bool)",
      "function owner() view returns (address)"
    ];

    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.ankr.com/eth_sepolia/6058e85189582de0fc7676b117ba4e4223a386651c25edfedd4d3822e240336f');
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log('=== Assigning Dispute Resolver ===');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Dispute Resolver Address:', DISPUTE_RESOLVER_ADDRESS);
    console.log('Owner Address:', wallet.address);

    // Check if the caller is the owner
    const owner = await contract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error('❌ Error: The provided private key is not for the contract owner');
      console.log('Contract Owner:', owner);
      console.log('Caller Address:', wallet.address);
      process.exit(1);
    }

    // Check current status
    const currentStatus = await contract.disputeResolvers(DISPUTE_RESOLVER_ADDRESS);
    console.log('Current Dispute Resolver Status:', currentStatus);

    if (currentStatus) {
      console.log('✅ Dispute resolver is already assigned');
    } else {
      // Assign dispute resolver
      console.log('Assigning dispute resolver...');
      const tx = await contract.assignDisputeResolver(DISPUTE_RESOLVER_ADDRESS, true);
      console.log('Transaction Hash:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);
      
      // Verify the assignment
      const newStatus = await contract.disputeResolvers(DISPUTE_RESOLVER_ADDRESS);
      console.log('New Dispute Resolver Status:', newStatus);
      
      if (newStatus) {
        console.log('✅ Dispute resolver assigned successfully!');
      } else {
        console.log('❌ Failed to assign dispute resolver');
      }
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
assignDisputeResolver()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 