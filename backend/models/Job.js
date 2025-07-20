const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  isCompleted: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  submission: { type: String }, // URL or description
});

const jobSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  budget: { type: Number, required: true },
  category: { type: String },
  milestones: [milestoneSchema],
  deadline: { type: Date },
  status: { type: String, enum: ['open', 'assigned', 'in_progress', 'submitted', 'completed', 'disputed', 'cancelled'], default: 'open' },
  contractTxHash: { type: String },
  escrowStatus: { type: String, enum: ['unfunded', 'funded', 'released'], default: 'unfunded' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema); 