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
    // ethers v6: use ethers.parseEther
    return milestones.map(m => ({
      description: m.description,
      amount: ethers.parseEther(m.amount.toString()),
      completed: false,
      paid: false,
      workDescription: ''
    }));
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
      // Convert milestone amounts to BigInt (wei)
      const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
      const formattedMilestones = this.#formatMilestones(milestones);
      // ethers v6: parseEther returns BigInt
      const tx = await this.contract.createJob(title, formattedMilestones, deadline, {
        value: ethers.parseEther(totalAmount.toString())
      });
      return await this.#handleTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
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
      return ethers.utils.formatEther(funds);
    } catch (error) {
      throw new Error(`Failed to get remaining funds: ${error.message}`);
    }
  }

  // Read-only: Get job details
  async getJob(jobId) {
    try {
      const job = await this.readOnlyContract.jobs(jobId);
      return {
        client: job.client,
        freelancer: job.freelancer,
        title: job.title,
        totalAmount: ethers.utils.formatEther(job.totalAmount),
        paidAmount: ethers.utils.formatEther(job.paidAmount),
        status: job.status,
        currentMilestone: job.currentMilestone.toNumber(),
        resolution: job.resolution,
        deadline: job.deadline.toNumber(),
        disputeReason: job.disputeReason,
        disputeRaisedAt: job.disputeRaisedAt.toNumber(),
        milestones: job.milestones.map(m => ({
          description: m.description,
          amount: ethers.utils.formatEther(m.amount),
          completed: m.completed,
          paid: m.paid,
          workDescription: m.workDescription
        })),
        proposals: job.proposals.map(p => ({
          freelancer: p.freelancer,
          proposal: p.proposal,
          bidAmount: ethers.utils.formatEther(p.bidAmount)
        }))
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
      return (await this.readOnlyContract.jobCounter()).toNumber();
    } catch (error) {
      throw new Error(`Failed to get job counter: ${error.message}`);
    }
  }

  // Read-only: Get commission rate
  async getCommissionRate() {
    try {
      return (await this.readOnlyContract.commissionRate()).toNumber();
    } catch (error) {
      throw new Error(`Failed to get commission rate: ${error.message}`);
    }
  }

  // Read-only: Get platform fees
  async getPlatformFees() {
    try {
      return ethers.utils.formatEther(await this.readOnlyContract.platformFees());
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