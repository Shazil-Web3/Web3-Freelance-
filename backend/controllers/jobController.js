const Job = require('../models/Job');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { uploadToIPFS } = require('../utils/ipfs');
// Update ethers import for v6
const { JsonRpcProvider, Wallet, Contract, parseEther } = require('ethers');

// Helper: Connect to contract (read-only, no private key)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = require('../config/constants').CONTRACT_ABI;
// Use Sepolia default RPC (public endpoint)
const sepoliaDefault = 'https://rpc.ankr.com/eth_sepolia/6058e85189582de0fc7676b117ba4e4223a386651c25edfedd4d3822e240336f';
const provider = new JsonRpcProvider(sepoliaDefault);
const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Create a new job (with IPFS and contract call)
exports.createJob = async (req, res) => {
  try {
    const { title, description, budget, category, milestones, deadline } = req.body;
    const client = req.user.id;
    // Upload description to IPFS
    const ipfsHash = await uploadToIPFS(Buffer.from(description));
    // Call smart contract to register job
    // (You may want to encode milestones, deadline, etc. as needed)
    const tx = await contract.createJob(title, ipfsHash, parseEther(budget.toString()), deadline);
    const receipt = await tx.wait();
    // Save job in DB
    const job = await Job.create({
      client,
      title,
      description, // Optionally store plaintext for search
      ipfsHash,
      budget,
      category,
      milestones,
      deadline,
      contractTxHash: receipt.transactionHash
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List jobs with role-based filters
exports.listJobs = async (req, res) => {
  try {
    const { client, freelancer, status } = req.query;
    const filter = {};
    if (client) filter.client = client;
    if (freelancer) filter.freelancer = freelancer;
    if (status) filter.status = status;
    const jobs = await Job.find(filter).populate('client freelancer');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// People Hired: list freelancers hired by a client
exports.peopleHired = async (req, res) => {
  try {
    const { client } = req.query;
    if (!client) return res.status(400).json({ message: 'Client wallet required' });
    const jobs = await Job.find({ client, freelancer: { $ne: null } }).populate('freelancer');
    const freelancers = jobs.map(j => j.freelancer).filter(Boolean);
    res.json(freelancers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get job by ID
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('client freelancer');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update job (owner only)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete job (owner only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await job.remove();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Track job state (update status)
exports.updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    // Only client or freelancer can update status
    if (![job.client.toString(), job.freelancer?.toString()].includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    job.status = req.body.status;
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ongoing Projects for Client
exports.ongoingProjectsClient = async (req, res) => {
  try {
    const { client } = req.query;
    if (!client) return res.status(400).json({ message: 'Client wallet required' });
    const jobs = await Job.find({ client, status: { $in: ['assigned', 'in_progress'] } }).populate('freelancer');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Completed Projects for Client
exports.completedProjectsClient = async (req, res) => {
  try {
    const { client } = req.query;
    if (!client) return res.status(400).json({ message: 'Client wallet required' });
    const jobs = await Job.find({ client, status: 'completed' }).populate('freelancer');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Ongoing Projects for Freelancer
exports.ongoingProjectsFreelancer = async (req, res) => {
  try {
    const { freelancer } = req.query;
    if (!freelancer) return res.status(400).json({ message: 'Freelancer wallet required' });
    const jobs = await Job.find({ freelancer, status: { $in: ['assigned', 'in_progress'] } }).populate('client');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Completed Projects for Freelancer
exports.completedProjectsFreelancer = async (req, res) => {
  try {
    const { freelancer } = req.query;
    if (!freelancer) return res.status(400).json({ message: 'Freelancer wallet required' });
    const jobs = await Job.find({ freelancer, status: 'completed' }).populate('client');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 