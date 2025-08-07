const Dispute = require('../models/Dispute');
const Job = require('../models/Job');
const ProjectSubmission = require('../models/ProjectSubmission');
const { uploadToIPFS } = require('../utils/ipfs');
const { Contract, JsonRpcProvider } = require('ethers');

// Helper: Connect to contract (read-only, no private key)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = require('../config/constants').CONTRACT_ABI;
const sepoliaDefault = 'https://rpc.ankr.com/eth_sepolia/6058e85189582de0fc7676b117ba4e4223a386651c25edfedd4d3822e240336f';
const provider = new JsonRpcProvider(sepoliaDefault);
const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

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
    // Remove the requirement for submission - make it optional
    // if (!submission) {
    //   return res.status(400).json({ message: 'No submission found for dispute' });
    // }

    // Create dispute
    const dispute = new Dispute({
      job: jobId,
      client: job.client,
      freelancer: job.freelancer,
      projectSubmission: submission ? submission._id : null, // Make it optional
      title,
      description,
      disputeType,
    });

    await dispute.save();
    
    // Populate the job with contractJobId for frontend
    const populatedDispute = await Dispute.findById(dispute._id)
      .populate({
        path: 'job',
        select: 'title contractJobId'
      })
      .populate('client', 'username walletAddress')
      .populate('freelancer', 'username walletAddress');

    console.log('Dispute created successfully:', {
      disputeId: dispute._id,
      jobId: jobId,
      contractJobId: job.contractJobId,
      client: job.client,
      freelancer: job.freelancer,
      title: title,
      status: dispute.status
    });

    res.json({ 
      message: 'Dispute created successfully', 
      dispute: populatedDispute
    });

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
    .populate('job', 'title contractJobId')
    .populate('client', 'username walletAddress')
    .populate('freelancer', 'username walletAddress')
    .sort({ createdAt: -1 });

    res.json({ disputes });

  } catch (error) {
    console.error('Get user disputes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all disputes (for dispute resolvers)
exports.getAllDisputes = async (req, res) => {
  try {
    // Check if user is a dispute resolver
    if (!req.user || !req.user.walletAddress) {
      return res.status(400).json({ message: 'User wallet address not found' });
    }
    
    const walletAddress = req.user.walletAddress.toLowerCase();
    const isResolver = await contract.disputeResolvers(walletAddress);
    console.log('Dispute resolver check:', { walletAddress, isResolver, userId: req.user.id });
    
    if (!isResolver) {
      return res.status(403).json({ message: 'Only dispute resolvers can view all disputes' });
    }

    // Get all disputes first to see what we have
    const allDisputes = await Dispute.find({})
      .populate('job', 'title contractJobId status budget')
      .populate('client', 'username walletAddress')
      .populate('freelancer', 'username walletAddress')
      .populate('projectSubmission', 'files')
      .sort({ createdAt: -1 });

    console.log('All disputes before filtering:', allDisputes.map(d => ({
      id: d._id,
      title: d.title,
      status: d.status
    })));

    // Get all disputes that are NOT resolved (filter out resolved disputes)
    const disputes = await Dispute.find({
      status: { $nin: ['resolved_client', 'resolved_freelancer'] } // Exclude resolved disputes
    })
      .populate('job', 'title contractJobId status budget')
      .populate('client', 'username walletAddress')
      .populate('freelancer', 'username walletAddress')
      .populate('projectSubmission', 'files')
      .sort({ createdAt: -1 });

    console.log('All disputes fetched for resolver:', {
      totalDisputes: disputes.length,
      disputes: disputes.map(d => ({
        id: d._id,
        title: d.title,
        status: d.status,
        jobId: d.job?._id,
        contractJobId: d.job?.contractJobId,
        client: d.client?.username || d.client?.walletAddress,
        freelancer: d.freelancer?.username || d.freelancer?.walletAddress
      }))
    });

    res.json({ disputes });
  } catch (error) {
    console.error('Get all disputes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Resolve dispute (dispute resolver)
exports.resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { decision, resolutionDescription } = req.body;

    // Check if user is a dispute resolver
    const walletAddress = req.user.walletAddress.toLowerCase();
    const isResolver = await contract.disputeResolvers(walletAddress);
    if (!isResolver) {
      return res.status(403).json({ message: 'Only dispute resolvers can resolve disputes' });
    }

    const dispute = await Dispute.findById(disputeId)
      .populate('job', 'contractJobId title status')
      .populate('client', 'walletAddress')
      .populate('freelancer', 'walletAddress');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status !== 'open' && dispute.status !== 'under_review') {
      return res.status(400).json({ message: 'Dispute is not in a resolvable state' });
    }

    console.log('Resolving dispute:', {
      disputeId: dispute._id,
      jobId: dispute.job._id,
      contractJobId: dispute.job.contractJobId,
      currentStatus: dispute.status,
      decision: decision
    });

    // Update dispute status
    dispute.status = decision === 'client_favor' ? 'resolved_client' : 'resolved_freelancer';
    dispute.resolution = {
      type: decision,
      description: resolutionDescription,
      resolvedBy: req.user.id,
      resolvedAt: new Date()
    };

    await dispute.save();
    console.log('Dispute updated in database');

    // Update job status in backend to 'completed' since payment was automatically released
    const job = await Job.findById(dispute.job._id);
    if (job) {
      // Set job status to completed since dispute is resolved and payment was released
      job.status = 'completed';
      job.updatedAt = new Date();
      await job.save();
      console.log('Job status updated to completed after dispute resolution');
    } else {
      console.error('Job not found for dispute:', dispute.job._id);
    }

    // Update project submission if it exists
    const ProjectSubmission = require('../models/ProjectSubmission');
    const submission = await ProjectSubmission.findOne({ job: dispute.job._id });
    if (submission) {
      submission.clientApproval.status = 'approved';
      submission.clientApproval.approvedAt = new Date();
      submission.clientApproval.feedback = `Project completed through dispute resolution. Payment automatically released to ${decision === 'client_favor' ? 'client' : 'freelancer'}.`;
      submission.updatedAt = new Date();
      await submission.save();
      console.log('Project submission updated after dispute resolution');
    } else {
      console.log('No project submission found for job:', dispute.job._id);
    }

    // Note: Smart contract call would be made here by the frontend
    // The frontend will call the resolveDispute function on the smart contract
    // with the appropriate Resolution enum value (0 for None, 1 for ClientWon, 2 for FreelancerWon)

    res.json({ 
      message: 'Dispute resolved successfully', 
      dispute,
      resolution: dispute.resolution,
      smartContractJobId: dispute.job?.contractJobId, // Return jobId for frontend to call smart contract
      jobStatus: 'completed', // Indicate that job is now completed
      paymentReleased: true // Indicate that payment was automatically released
    });

  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel project (dispute resolver)
exports.cancelProject = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { cancellationReason } = req.body;

    // Check if user is a dispute resolver
    const walletAddress = req.user.walletAddress.toLowerCase();
    const isResolver = await contract.disputeResolvers(walletAddress);
    if (!isResolver) {
      return res.status(403).json({ message: 'Only dispute resolvers can cancel projects' });
    }

    const dispute = await Dispute.findById(disputeId)
      .populate('job', 'contractJobId title')
      .populate('client', 'walletAddress')
      .populate('freelancer', 'walletAddress');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status !== 'open' && dispute.status !== 'under_review') {
      return res.status(400).json({ message: 'Dispute is not in a cancellable state' });
    }

    // Update dispute status
    dispute.status = 'closed';
    dispute.resolution = {
      type: 'cancelled',
      description: cancellationReason,
      resolvedBy: req.user.id,
      resolvedAt: new Date()
    };

    await dispute.save();

    // Update job status in backend
    const job = await Job.findById(dispute.job._id);
    if (job) {
      job.status = 'cancelled';
      await job.save();
    }

    // Note: Smart contract call would be made here by the frontend
    // The frontend will call the cancelProject function on the smart contract

    res.json({ 
      message: 'Project cancelled successfully', 
      dispute,
      resolution: dispute.resolution,
      smartContractJobId: dispute.job?.contractJobId // Return jobId for frontend to call smart contract
    });

  } catch (error) {
    console.error('Cancel project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if user is dispute resolver
exports.checkDisputeResolver = async (req, res) => {
  try {
    const walletAddress = req.user.walletAddress.toLowerCase();
    const isResolver = await contract.disputeResolvers(walletAddress);
    res.json({ isDisputeResolver: isResolver });
  } catch (error) {
    console.error('Check dispute resolver error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get disputes for a specific job
exports.getJobDisputes = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const disputes = await Dispute.find({ job: jobId })
      .populate('client', 'username walletAddress')
      .populate('freelancer', 'username walletAddress')
      .populate('job', 'title contractJobId status')
      .sort({ createdAt: -1 });

    res.json({ disputes });
  } catch (error) {
    console.error('Get job disputes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
