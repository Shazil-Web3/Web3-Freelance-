// context/jobAsCrewOneContext.js
"use client"
import { ethers } from 'ethers';
import jobAsCrewOneArtifact from './contract.json';

const jobAsCrewOneABI = jobAsCrewOneArtifact.abi;

class JobAsCrewOneContext {
  constructor(contractAddress, provider) {
    this.provider = provider || window.ethereum;
    if (!this.provider) {
      throw new Error('No Ethereum provider found. Ensure MetaMask or another provider is installed.');
    }
    // ethers v6: BrowserProvider.getSigner() is async, so this is not safe for sync construction
    // Warn if used synchronously
    if (typeof window !== 'undefined') {
      console.warn('JobAsCrewOneContext: Use JobAsCrewOneContext.createAsync() for async-safe initialization.');
    }
    this.signer = null;
    this.contract = null;
    this.readOnlyContract = null;
  }

  static async createAsync(contractAddress, provider) {
    const ctx = new JobAsCrewOneContext(contractAddress, provider);
    const browserProvider = new ethers.BrowserProvider(ctx.provider);
    ctx.signer = await browserProvider.getSigner();
    ctx.contract = new ethers.Contract(contractAddress, jobAsCrewOneABI, ctx.signer);
    ctx.readOnlyContract = new ethers.Contract(contractAddress, jobAsCrewOneABI, browserProvider);
    return ctx;
  }

  // Helper to handle transaction waits and errors
  async #handleTransaction(tx) {
    try {
      const receipt = await tx.wait();
      return { success: true, transactionHash: receipt.transactionHash };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.reason || error.message}`);
    }
  }

  // Helper to format milestone array for createJob
  #formatMilestones(milestones) {
    // Validate that milestones is an array
    if (!Array.isArray(milestones)) {
      throw new Error('Milestones must be an array');
    }
    
    // ethers v6: use ethers.parseEther
    return milestones.map(m => {
      if (!m || typeof m.description !== 'string' || !m.amount) {
        throw new Error('Each milestone must have a description and amount');
      }
      
      return {
        description: m.description,
        amount: ethers.parseEther(m.amount.toString()),
        completed: false,
        paid: false,
        workDescription: ''
      };
    });
  }

  // Toggle contract pause state (onlyOwner)
  async togglePause(paused) {
    try {
      const tx = await this.contract.togglePause(paused);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to toggle pause: ${error.message}`);
    }
  }

  // Assign/remove dispute resolver (onlyOwner)
  async assignDisputeResolver(user, status) {
    try {
      const tx = await this.contract.assignDisputeResolver(user, status);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to assign dispute resolver: ${error.message}`);
    }
  }

  // Create a job with milestones (client)
  async createJob(title, milestones, deadline) {
    try {
      // STEP 1: Get the current job counter to predict the next job ID
      const currentJobCounter = await this.readOnlyContract.jobCounter();
      const predictedJobId = Number(currentJobCounter);
      
      // STEP 2: Format milestones and calculate total
      const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
      const formattedMilestones = this.#formatMilestones(milestones);
      
      // STEP 3: Create the job on the blockchain
      const tx = await this.contract.createJob(title, formattedMilestones, deadline, {
        value: ethers.parseEther(totalAmount.toString())
      });
      
      // STEP 4: Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // STEP 5: Return the predicted job ID (this is reliable since job creation increments the counter)
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        jobId: predictedJobId
      };
      
    } catch (error) {
      throw error;
    }
  }

  // Apply to a job (freelancer)
  async applyToProject(jobId, proposal, bidAmount) {
    try {
      const tx = await this.contract.applyToProject(jobId, proposal, ethers.parseEther(bidAmount.toString()));
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to apply to project: ${error.message}`);
    }
  }

  // Select freelancer (client)
  async selectFreelancer(jobId, freelancer) {
    try {
      const tx = await this.contract.selectFreelancer(jobId, freelancer);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to select freelancer: ${error.message}`);
    }
  }

  // Mark milestone as completed (freelancer)
  async completeMilestone(jobId, workDescription) {
    try {
      const tx = await this.contract.completeMilestone(jobId, workDescription);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to complete milestone: ${error.message}`);
    }
  }

  // Release payment for milestone (client)
  async releasePayment(jobId) {
    try {
      const tx = await this.contract.releasePayment(jobId);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to release payment: ${error.message}`);
    }
  }

  // Raise dispute (client or freelancer)
  async raiseDispute(jobId, reason) {
    try {
      const tx = await this.contract.raiseDispute(jobId, reason);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to raise dispute: ${error.message}`);
    }
  }

  // Resolve dispute (dispute resolver)
  async resolveDispute(jobId, decision) {
    try {
      const tx = await this.contract.resolveDispute(jobId, decision);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to resolve dispute: ${error.message}`);
    }
  }

  // Withdraw freelancer earnings
  async withdrawFreelancerEarnings() {
    try {
      const tx = await this.contract.withdrawFreelancerEarnings();
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to withdraw earnings: ${error.message}`);
    }
  }

  // Cancel project (client)
  async cancelProject(jobId) {
    try {
      const tx = await this.contract.cancelProject(jobId);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to cancel project: ${error.message}`);
    }
  }

  // Update commission rate (onlyOwner)
  async updateCommissionRate(percent) {
    try {
      const tx = await this.contract.updateCommissionRate(percent);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to update commission rate: ${error.message}`);
    }
  }

  // Withdraw platform fees (onlyOwner)
  async withdrawPlatformFees() {
    try {
      const tx = await this.contract.withdrawPlatformFees();
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to withdraw platform fees: ${error.message}`);
    }
  }

  // Set contract owner (onlyOwner)
  async setContractOwner(newOwner) {
    try {
      const tx = await this.contract.setContractOwner(newOwner);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to set contract owner: ${error.message}`);
    }
  }

  // Emergency withdraw (onlyOwner)
  async emergencyWithdraw(jobId) {
    try {
      const tx = await this.contract.emergencyWithdraw(jobId);
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to emergency withdraw: ${error.message}`);
    }
  }

  // Read-only: Get remaining funds for a job
  async remainingFunds(jobId) {
    try {
      const funds = await this.readOnlyContract.remainingFunds(jobId);
      return ethers.formatEther(funds);
    } catch (error) {
      throw new Error(`Failed to get remaining funds: ${error.message}`);
    }
  }

  // Read-only: Get job details
  async getJob(jobId) {
    try {
      const job = await this.readOnlyContract.jobs(jobId);
      
      // Map status enum values
      const statusMap = ['Open', 'InProgress', 'Completed', 'Disputed', 'Resolved'];
      const statusText = statusMap[Number(job.status)] || 'Unknown';
      
      return {
        client: job.client,
        freelancer: job.freelancer,
        title: job.title,
        totalAmount: ethers.formatEther(job.totalAmount),
        paidAmount: ethers.formatEther(job.paidAmount),
        status: statusText,
        statusNumber: Number(job.status),
        currentMilestone: Number(job.currentMilestone),
        resolution: Number(job.resolution),
        deadline: Number(job.deadline),
        disputeReason: job.disputeReason,
        disputeRaisedAt: Number(job.disputeRaisedAt),
        // Note: milestones and proposals arrays are not available via the jobs() mapping
        // They need to be retrieved separately via events or other methods
        milestones: [],
        proposals: []
      };
    } catch (error) {
      throw new Error(`Failed to get job details: ${error.message}`);
    }
  }

  // Read-only: Get contract owner
  async getOwner() {
    try {
      return await this.readOnlyContract.owner();
    } catch (error) {
      throw new Error(`Failed to get owner: ${error.message}`);
    }
  }

  // Read-only: Check if address is dispute resolver
  async isDisputeResolver(address) {
    try {
      return await this.readOnlyContract.disputeResolvers(address);
    } catch (error) {
      throw new Error(`Failed to check dispute resolver: ${error.message}`);
    }
  }

  // Read-only: Get job counter
  async getJobCounter() {
    try {
      return Number(await this.readOnlyContract.jobCounter());
    } catch (error) {
      throw new Error(`Failed to get job counter: ${error.message}`);
    }
  }

  // Read-only: Get commission rate
  async getCommissionRate() {
    try {
      return Number(await this.readOnlyContract.commissionRate());
    } catch (error) {
      throw new Error(`Failed to get commission rate: ${error.message}`);
    }
  }

  // Read-only: Get platform fees
  async getPlatformFees() {
    try {
      return ethers.formatEther(await this.readOnlyContract.platformFees());
    } catch (error) {
      throw new Error(`Failed to get platform fees: ${error.message}`);
    }
  }

  // Read-only: Check if contract is paused
  async isPaused() {
    try {
      return await this.readOnlyContract.paused();
    } catch (error) {
      throw new Error(`Failed to check pause status: ${error.message}`);
    }
  }

  // Event listeners
  listenToEvent(eventName, callback) {
    this.contract.on(eventName, (...args) => {
      callback(...args);
    });
  }

  // Stop listening to an event
  removeEventListener(eventName) {
    this.contract.removeAllListeners(eventName);
  }
}

export default JobAsCrewOneContext;