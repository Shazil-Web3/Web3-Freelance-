const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// Apply to a job
exports.applyToJob = async (req, res) => {
  try {
    const { jobId, proposal, duration, fee } = req.body;
    const freelancer = req.user.id;
    // Prevent duplicate applications
    const exists = await Application.findOne({ job: jobId, freelancer });
    if (exists) return res.status(400).json({ message: 'Already applied' });
    const app = await Application.create({ job: jobId, freelancer, proposal, duration, fee });
    res.status(201).json(app);
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

// List applications by freelancer
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