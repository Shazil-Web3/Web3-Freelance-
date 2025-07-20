const Review = require('../models/Review');
const Job = require('../models/Job');

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { jobId, reviewee, rating, comment } = req.body;
    const reviewer = req.user.id;
    // Prevent duplicate reviews for the same job/reviewee
    const exists = await Review.findOne({ job: jobId, reviewer, reviewee });
    if (exists) return res.status(400).json({ message: 'Already reviewed' });
    const review = await Review.create({ job: jobId, reviewer, reviewee, rating, comment });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List reviews for a user
exports.listForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reviews = await Review.find({ reviewee: userId }).populate('reviewer job');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 