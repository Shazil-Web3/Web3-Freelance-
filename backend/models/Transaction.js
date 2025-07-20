const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  txHash: { type: String, required: true },
  type: { type: String, enum: ['fund', 'release', 'dispute', 'other'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema); 