const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { Contract, JsonRpcProvider, parseEther } = require('ethers');

// Helper: Connect to contract (read-only, no private key)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = require('../config/constants').CONTRACT_ABI;
const sepoliaDefault = 'https://rpc.ankr.com/eth_sepolia/6058e85189582de0fc7676b117ba4e4223a386651c25edfedd4d3822e240336f';
const provider = new JsonRpcProvider(sepoliaDefault);
const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Apply to a job (calls contract)
exports.applyToJob = async (req, res) => {
  try {
    const { jobId, proposal, duration, fee } = req.body;
    const freelancer = req.user.id;
    // Prevent duplicate applications
    const exists = await Application.findOne({ job: jobId, freelancer });
    if (exists) return res.status(400).json({ message: 'Already applied' });
    // Call smart contract to register application (DISABLED: no private key for write)
    // const tx = await contract.applyToProject(jobId, proposal, parseEther(fee.toString()));
    // const receipt = await tx.wait();
    const app = await Application.create({ job: jobId, freelancer, proposal, duration, fee, status: 'pending' });
    res.status(201).json({ app /*, txHash: receipt.transactionHash */ });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List applications for a job
exports.listForJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const apps = await Application.find({ job: jobId }).populate('freelancer');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List applications by freelancer (role-based)
exports.listForFreelancer = async (req, res) => {
  try {
    const freelancer = req.user.id;
    const apps = await Application.find({ freelancer }).populate('job');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept or reject application (by client)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findById(req.params.id).populate('job');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const job = await Job.findById(app.job._id);
    if (job.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    app.status = status;
    await app.save();
    // If accepted, assign freelancer to job and update job status
    if (status === 'accepted') {
      job.freelancer = app.freelancer;
      job.status = 'in_progress';
      await job.save();
    }
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Withdraw application (by freelancer)
exports.withdraw = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.freelancer.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    app.status = 'withdrawn';
    await app.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Applied Jobs for Freelancer (dashboard)
exports.appliedJobs = async (req, res) => {
  try {
    const freelancer = req.user.id;
    const apps = await Application.find({ freelancer }).populate('job');
    const appliedJobs = apps.map(app => ({
      job: app.job,
      status: app.status
    }));
    res.json(appliedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 