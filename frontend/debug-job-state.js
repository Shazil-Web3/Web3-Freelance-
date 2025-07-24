const { ethers } = require('ethers');

// Debug script to check job state and freelancer assignment
async function debugJobState() {
  try {
    // Replace these with your actual values
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS";
    const JOB_ID = 0; // Replace with the actual contractJobId you're trying to access
    const RPC_URL = "https://rpc.ankr.com/eth_sepolia/6058e85189582de0fc7676b117ba4e4223a386651c25edfedd4d3822e240336f"; // or your RPC
    
    // Contract ABI - simplified version with just the functions we need
    const CONTRACT_ABI = [
      "function jobs(uint256) view returns (address client, address freelancer, string title, uint256 totalAmount, uint256 paidAmount, uint8 status, uint256 currentMilestone, uint8 resolution, uint256 deadline, string disputeReason, uint256 disputeRaisedAt)",
      "function jobCounter() view returns (uint256)"
    ];

    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log('=== JOB STATE DEBUG ===');
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('Job ID:', JOB_ID);
    
    // Get total number of jobs
    const jobCounter = await contract.jobCounter();
    console.log('Total Jobs in Contract:', Number(jobCounter));
    
    if (JOB_ID >= Number(jobCounter)) {
      console.log('❌ ERROR: Job ID is higher than total job count!');
      console.log('Available Job IDs: 0 to', Number(jobCounter) - 1);
      return;
    }

    // Get job details
    const job = await contract.jobs(JOB_ID);
    console.log('\n=== JOB DETAILS ===');
    console.log('Client:', job.client);
    console.log('Freelancer:', job.freelancer);
    console.log('Title:', job.title);
    console.log('Total Amount:', ethers.formatEther(job.totalAmount), 'ETH');
    console.log('Paid Amount:', ethers.formatEther(job.paidAmount), 'ETH');
    console.log('Status:', Number(job.status), '(0=Open, 1=InProgress, 2=Completed, 3=Disputed, 4=Resolved)');
    console.log('Current Milestone:', Number(job.currentMilestone));
    console.log('Deadline:', new Date(Number(job.deadline) * 1000).toISOString());
    
    // Check if freelancer is assigned
    if (job.freelancer === ethers.ZeroAddress) {
      console.log('❌ NO FREELANCER ASSIGNED to this job!');
      console.log('   - This job is still open and no freelancer has been selected');
      console.log('   - The client needs to select a freelancer first');
    } else {
      console.log('✅ Freelancer assigned:', job.freelancer);
    }
    
    // Check job status
    if (Number(job.status) !== 1) { // 1 = InProgress
      console.log('❌ Job status is not "InProgress"');
      console.log('   - Current status:', Number(job.status));
      console.log('   - Expected status: 1 (InProgress)');
      console.log('   - Only "InProgress" jobs can have milestones completed');
    } else {
      console.log('✅ Job status is "InProgress" - ready for milestone completion');
    }
    
    console.log('\n=== WALLET CHECK ===');
    console.log('To complete milestone, your wallet address must match the freelancer address above.');
    console.log('Check your MetaMask wallet address and compare with the freelancer address.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure CONTRACT_ADDRESS is correct');
    console.log('2. Make sure JOB_ID exists');
    console.log('3. Make sure you have internet connection');
    console.log('4. Make sure the RPC URL is working');
  }
}

// Run the debug
debugJobState();
