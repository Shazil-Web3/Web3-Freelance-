const Job = require('../models/Job');

// Mark milestone as completed (by freelancer)
exports.completeMilestone = async (req, res) => {
  try {
    const { jobId, milestoneIndex, submission } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.freelancer.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    job.milestones[milestoneIndex].isCompleted = true;
    job.milestones[milestoneIndex].submission = submission;
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve milestone and mark as paid (by client)
exports.approveMilestone = async (req, res) => {
  try {
    const { jobId, milestoneIndex } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    job.milestones[milestoneIndex].isPaid = true;
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 