const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');

// Get user profile by wallet address
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.wallet.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile (except wallet address)
exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.walletAddress;
    const user = await User.findOneAndUpdate(
      { walletAddress: req.params.wallet.toLowerCase() },
      updates,
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Dashboard: get jobs, applications, reviews, transactions for a user
exports.getDashboard = async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const user = await User.findOne({ walletAddress: wallet });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Jobs posted (if client)
    const jobsPosted = await Job.find({ client: user._id }).populate('freelancer');
    // Jobs assigned (if freelancer)
    const jobsAssigned = await Job.find({ freelancer: user._id });
    // Attach latest project submission (with files) to each job
    const ProjectSubmission = require('../models/ProjectSubmission');
    const { getIpfsUrl } = require('../utils/ipfs');
    async function attachSubmission(job) {
      const submission = await ProjectSubmission.findOne({ job: job._id })
        .populate('freelancer', 'username walletAddress');
      if (submission) {
        const submissionWithUrls = submission.toObject();
        submissionWithUrls.files = submission.files.map(file => ({
          ...file.toObject(),
          url: getIpfsUrl(file.ipfsHash)
        }));
        job = job.toObject();
        job.submission = submissionWithUrls;
      } else {
        job = job.toObject();
      }
      // Always include contractJobId as jobId (number)
      job.jobId = typeof job.contractJobId === 'number' ? job.contractJobId : Number(job.contractJobId);
      return job;
    }
    const jobsPostedWithSub = await Promise.all(jobsPosted.map(attachSubmission));
    const jobsAssignedWithSub = await Promise.all(jobsAssigned.map(attachSubmission));
    // Applications sent (if freelancer)
    const applications = await Application.find({ freelancer: user._id }).populate('job');
    // Applications received (if client)
    const applicationsReceived = await Application.find({}).populate({ path: 'job', match: { client: user._id } });
    // Transactions
    const transactions = await Transaction.find({ user: user._id });

    // Add jobId to applications and applicationsReceived
    const addJobIdToApp = (app) => {
      app = app.toObject();
      if (app.job && app.job.contractJobId !== undefined) {
        app.jobId = typeof app.job.contractJobId === 'number' ? app.job.contractJobId : Number(app.job.contractJobId);
        if (!app.job.jobId) app.job.jobId = app.jobId;
      }
      return app;
    };
    const applicationsWithJobId = applications.map(addJobIdToApp);
    const applicationsReceivedWithJobId = applicationsReceived.map(addJobIdToApp);

    res.json({
      user,
      jobsPosted: jobsPostedWithSub,
      jobsAssigned: jobsAssignedWithSub,
      applications: applicationsWithJobId,
      applicationsReceived: applicationsReceivedWithJobId,
      transactions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 