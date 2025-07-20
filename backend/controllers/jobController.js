const Job = require('../models/Job');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const { title, description, budget, category, milestones, deadline } = req.body;
    const client = req.user.id;
    const job = await Job.create({
      client,
      title,
      description,
      budget,
      category,
      milestones,
      deadline
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List jobs with optional filters
exports.listJobs = async (req, res) => {
  try {
    const { category, minBudget, maxBudget, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (minBudget || maxBudget) filter.budget = {};
    if (minBudget) filter.budget.$gte = Number(minBudget);
    if (maxBudget) filter.budget.$lte = Number(maxBudget);
    const jobs = await Job.find(filter).populate('client freelancer');
    res.json(jobs);
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