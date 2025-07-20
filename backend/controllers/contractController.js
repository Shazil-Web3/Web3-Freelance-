const Transaction = require('../models/Transaction');
const Job = require('../models/Job');

// Store a smart contract transaction hash
exports.storeTx = async (req, res) => {
  try {
    const { jobId, txHash, type } = req.body;
    const user = req.user.id;
    const tx = await Transaction.create({ job: jobId, user, txHash, type });
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update escrow status for a job
exports.updateEscrowStatus = async (req, res) => {
  try {
    const { jobId, status } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.escrowStatus = status;
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify tx onchain (stub)
exports.verifyTx = async (req, res) => {
  // This would use ethers.js/web3 to check tx status
  res.json({ status: 'stub', message: 'Onchain verification not implemented' });
}; 