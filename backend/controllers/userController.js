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
    const applicationsReceived = await Application.find({})
      .populate({ path: 'job', match: { client: user._id } })
      .populate({
        path: 'freelancer',
        select: 'username walletAddress email userRole createdAt',
        model: 'User'
      });
    
    // Filter out applications where job is null (doesn't match client)
    const validApplicationsReceived = applicationsReceived.filter(app => app.job !== null);
    
    // Debug: Log freelancer data for each application
    console.log('DEBUG: Applications received for client:', user.walletAddress);
    console.log('DEBUG: Total applications before filtering:', applicationsReceived.length);
    console.log('DEBUG: Valid applications after filtering:', validApplicationsReceived.length);
    
    validApplicationsReceived.forEach((app, index) => {
      console.log(`Application ${index + 1}:`, {
        appId: app._id,
        jobTitle: app.job?.title,
        jobId: app.job?._id,
        freelancerId: app.freelancer?._id,
        freelancerObjectId: app.freelancer,
        freelancerUsername: app.freelancer?.username,
        freelancerWallet: app.freelancer?.walletAddress,
        freelancerEmail: app.freelancer?.email,
        freelancerFull: app.freelancer,
        status: app.status
      });
    });
    
    // Also check if there are any orphaned applications
    const orphanedApps = applicationsReceived.filter(app => app.job === null);
    if (orphanedApps.length > 0) {
      console.log('DEBUG: Found orphaned applications (no matching job):', orphanedApps.length);
      orphanedApps.forEach((app, index) => {
        console.log(`Orphaned Application ${index + 1}:`, {
          appId: app._id,
          jobId: app.job,
          freelancerId: app.freelancer?._id,
          status: app.status
        });
      });
    }
    // Transactions
    const transactions = await Transaction.find({ user: user._id });

    // Add jobId to applications and applicationsReceived
    const addJobIdToApp = (app) => {
      const appObj = app.toObject ? app.toObject() : app;
      if (appObj.job && appObj.job.contractJobId !== undefined) {
        appObj.jobId = typeof appObj.job.contractJobId === 'number' ? appObj.job.contractJobId : Number(appObj.job.contractJobId);
        if (!appObj.job.jobId) appObj.job.jobId = appObj.jobId;
      }
      // Ensure freelancer data is properly preserved
      if (app.freelancer && !appObj.freelancer) {
        appObj.freelancer = app.freelancer.toObject ? app.freelancer.toObject() : app.freelancer;
      }
      return appObj;
    };
    const applicationsWithJobId = applications.map(addJobIdToApp);
    const applicationsReceivedWithJobId = validApplicationsReceived.map(addJobIdToApp);

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