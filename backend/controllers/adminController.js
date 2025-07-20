const User = require('../models/User');
const Job = require('../models/Job');
const Transaction = require('../models/Transaction');

// Get admin stats
exports.getStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const jobs = await Job.countDocuments();
    const revenue = await Transaction.aggregate([
      { $match: { type: 'release', status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const escrow = await Transaction.countDocuments({ type: 'fund', status: 'confirmed' });
    res.json({ users, jobs, revenue: revenue[0]?.total || 0, escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Flag/report abuse (stub)
exports.flagAbuse = async (req, res) => {
  // Implement abuse reporting logic here
  res.json({ status: 'stub', message: 'Abuse reporting not implemented' });
}; 