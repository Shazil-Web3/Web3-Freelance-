// Debug script to check job deadlines
// Run this with: node debug-deadline.js

const { ethers } = require('ethers');

// Configuration
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE'; // Replace with your actual contract address
const CONTRACT_ABI = [
  // Add minimal ABI for reading job data
  "function jobs(uint256) view returns (address client, address freelancer, string title, uint256 totalAmount, uint256 paidAmount, uint8 status, uint256 currentMilestone, uint8 resolution, uint256 deadline, string disputeReason, uint256 disputeRaisedAt)",
  "function jobCounter() view returns (uint256)"
];

async function checkJobDeadlines() {
  try {
    // Connect to Sepolia testnet
    const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Get current timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    console.log('Current timestamp:', currentTimestamp);
    console.log('Current date:', new Date().toISOString());
    console.log('---');
    
    // Get job counter
    const jobCounter = await contract.jobCounter();
    console.log('Total jobs created:', jobCounter.toString());
    
    // Check last few jobs
    const jobsToCheck = Math.min(Number(jobCounter), 5);
    for (let i = Math.max(0, Number(jobCounter) - jobsToCheck); i < Number(jobCounter); i++) {
      try {
        const job = await contract.jobs(i);
        const deadline = Number(job.deadline);
        const deadlineDate = new Date(deadline * 1000);
        const timeRemaining = deadline - currentTimestamp;
        
        console.log(`Job ID: ${i}`);
        console.log(`Title: ${job.title}`);
        console.log(`Deadline timestamp: ${deadline}`);
        console.log(`Deadline date: ${deadlineDate.toISOString()}`);
        console.log(`Time remaining: ${timeRemaining} seconds`);
        console.log(`Status: ${timeRemaining > 0 ? 'ACTIVE' : 'EXPIRED'}`);
        console.log('---');
      } catch (error) {
        console.log(`Job ID ${i}: Error reading job data`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the check
checkJobDeadlines();
