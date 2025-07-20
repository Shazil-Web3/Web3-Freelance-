const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: false },
  bio: { type: String },
  avatarURL: { type: String },
  userRole: { type: String, enum: ['client', 'freelancer', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 