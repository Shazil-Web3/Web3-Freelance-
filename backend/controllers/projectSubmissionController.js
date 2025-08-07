const ProjectSubmission = require('../models/ProjectSubmission');
const Job = require('../models/Job');
const { uploadToIPFS, getIpfsUrl } = require('../utils/ipfs');

// Upload project files for a job
exports.uploadProjectFiles = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Verify job exists and freelancer is authorized
    const job = await Job.findById(jobId).populate('client freelancer');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.freelancer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: Only assigned freelancer can upload files' });
    }

    if (!['assigned', 'in_progress'].includes(job.status)) {
      return res.status(400).json({ message: 'Job is not in a state that allows file uploads' });
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
          mimeType: file.mimetype
        });
      } catch (error) {
        console.error('IPFS upload error:', error);
        return res.status(500).json({ message: 'Failed to upload file to IPFS' });
      }
    }

    // Find existing submission or create new one
    let submission = await ProjectSubmission.findOne({ job: jobId, freelancer: req.user.id });
    
    if (submission) {
      // Add new files to existing submission
      submission.files.push(...uploadedFiles);
      if (description) {
        submission.description = description;
      }
      submission.updatedAt = new Date();
    } else {
      // Create new submission
      submission = new ProjectSubmission({
        job: jobId,
        freelancer: req.user.id,
        files: uploadedFiles,
        description: description || ''
      });
    }

    await submission.save();
    
    // Update job status to in_progress if not already
    if (job.status === 'assigned') {
      job.status = 'in_progress';
      await job.save();
    }

    // Populate the submission for response
    const populatedSubmission = await ProjectSubmission.findById(submission._id)
      .populate('job', 'title')
      .populate('freelancer', 'username walletAddress');

    res.json({
      message: 'Files uploaded successfully',
      submission: populatedSubmission,
      fileUrls: uploadedFiles.map(f => ({ filename: f.filename, url: getIpfsUrl(f.ipfsHash) }))
    });

  } catch (error) {
    console.error('Upload project files error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark project as complete by freelancer
exports.markProjectComplete = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ message: 'Job is not in progress' });
    }

    // Find the submission
    const submission = await ProjectSubmission.findOne({ job: jobId, freelancer: req.user.id });
    if (!submission) {
      return res.status(400).json({ message: 'No submission found. Please upload project files first.' });
    }

    // Mark as complete
    submission.isMarkedComplete = true;
    submission.markedCompleteAt = new Date();
    submission.updatedAt = new Date();
    await submission.save();

    // Update job status
    job.status = 'submitted';
    job.updatedAt = new Date();
    await job.save();

    res.json({ message: 'Project marked as complete. Awaiting client approval.' });

  } catch (error) {
    console.error('Mark project complete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Client approves project
exports.approveProject = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { feedback } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if job is in a state that can be approved
    // The job can be approved if it's either 'submitted' (backend) or 'in_progress' (smart contract equivalent)
    if (job.status !== 'submitted' && job.status !== 'in_progress') {
      return res.status(400).json({ 
        message: `Job is not ready for approval. Current status: ${job.status}. Job must be marked as complete by freelancer.` 
      });
    }

    // Find the submission
    const submission = await ProjectSubmission.findOne({ job: jobId });
    if (!submission || !submission.isMarkedComplete) {
      return res.status(400).json({ message: 'Project not marked as complete by freelancer' });
    }

    // Approve the project
    submission.clientApproval.status = 'approved';
    submission.clientApproval.approvedAt = new Date();
    submission.clientApproval.feedback = feedback || '';
    submission.updatedAt = new Date();
    await submission.save();

    // Update job status
    job.status = 'completed';
    job.updatedAt = new Date();
    await job.save();

    // Note: Smart contract payment release is handled by the frontend
    // The frontend will call the releasePayment function on the smart contract

    res.json({ message: 'Project approved successfully. Payment will be released.' });

  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get project submission details
exports.getProjectSubmission = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify user is either client or freelancer of this job
    if (job.client.toString() !== req.user.id && job.freelancer?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const submission = await ProjectSubmission.findOne({ job: jobId })
      .populate('job', 'title status')
      .populate('freelancer', 'username walletAddress');

    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }

    // Add IPFS URLs to files
    const submissionWithUrls = submission.toObject();
    submissionWithUrls.files = submission.files.map(file => ({
      ...file.toObject(),
      url: getIpfsUrl(file.ipfsHash)
    }));

    res.json({ submission: submissionWithUrls });

  } catch (error) {
    console.error('Get project submission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
