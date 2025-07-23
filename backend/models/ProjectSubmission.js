const mongoose = require('mongoose');

const projectSubmissionSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{
    filename: { type: String, required: true },
    ipfsHash: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  description: { type: String },
  isMarkedComplete: { type: Boolean, default: false },
  markedCompleteAt: { type: Date },
  clientApproval: { 
    status: { type: String, enum: ['pending', 'approved', 'disputed'], default: 'pending' },
    approvedAt: { type: Date },
    feedback: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProjectSubmission', projectSubmissionSchema);
