const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Review = require('../models/Review');
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
    // Applications sent (if freelancer)
    const applications = await Application.find({ freelancer: user._id }).populate('job');
    // Applications received (if client)
    const applicationsReceived = await Application.find({}).populate({ path: 'job', match: { client: user._id } });
    // Reviews
    const reviews = await Review.find({ reviewee: user._id });
    // Transactions
    const transactions = await Transaction.find({ user: user._id });

    res.json({
      user,
      jobsPosted,
      jobsAssigned,
      applications,
      applicationsReceived,
      reviews,
      transactions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 