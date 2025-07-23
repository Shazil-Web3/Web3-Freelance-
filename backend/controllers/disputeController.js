const Dispute = require('../models/Dispute');
const Job = require('../models/Job');
const ProjectSubmission = require('../models/ProjectSubmission');
const { uploadToIPFS } = require('../utils/ipfs');

// Create a new dispute
exports.createDispute = async (req, res) => {
  try {
    const { jobId, title, description, disputeType } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isClient = job.client.toString() === req.user.id;
    const isFreelancer = job.freelancer && job.freelancer.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Only clients or freelancers can raise a dispute' });
    }

    const submission = await ProjectSubmission.findOne({ job: jobId });
    if (!submission) {
      return res.status(400).json({ message: 'No submission found for dispute' });
    }

    // Create dispute
    const dispute = new Dispute({
      job: jobId,
      client: job.client,
      freelancer: job.freelancer,
      projectSubmission: submission._id,
      title,
      description,
      disputeType,
    });

    await dispute.save();
    res.json({ message: 'Dispute created successfully', dispute });

  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload evidence for dispute
exports.uploadEvidence = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check if the user is involved in the dispute
    const isClient = dispute.client.toString() === req.user.id;
    const isFreelancer = dispute.freelancer.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Upload files to IPFS
    const uploadedFiles = [];
    for (const file of files) {
      try {
        const ipfsHash = await uploadToIPFS(file.buffer);
        uploadedFiles.push({
          filename: file.originalname,
          ipfsHash,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user.id
        });
      } catch (error) {
        console.error('IPFS upload error:', error);
        return res.status(500).json({ message: 'Failed to upload file to IPFS' });
      }
    }

    dispute.evidence.push(...uploadedFiles);
    await dispute.save();

    res.json({ message: 'Evidence uploaded successfully', evidence: dispute.evidence });

  } catch (error) {
    console.error('Upload evidence error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get dispute details
exports.getDisputeDetails = async (req, res) => {
  try {
    const { disputeId } = req.params;

    const dispute = await Dispute.findById(disputeId)
      .populate('job', 'title')
      .populate('client', 'username')
      .populate('freelancer', 'username')
      .populate('projectSubmission');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check if the user is involved in the dispute or is an admin
    const isClient = dispute.client.toString() === req.user.id;
    const isFreelancer = dispute.freelancer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({ dispute });

  } catch (error) {
    console.error('Get dispute details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all disputes for a user
exports.getUserDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [
        { client: req.user.id },
        { freelancer: req.user.id }
      ]
    })
    .populate('job', 'title')
    .populate('client', 'username walletAddress')
    .populate('freelancer', 'username walletAddress')
    .sort({ createdAt: -1 });

    res.json({ disputes });

  } catch (error) {
    console.error('Get user disputes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
