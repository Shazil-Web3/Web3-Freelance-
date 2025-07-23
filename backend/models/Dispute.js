const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectSubmission' },
  
  // Dispute details
  title: { type: String, required: true },
  description: { type: String, required: true },
  disputeType: { 
    type: String, 
    enum: ['quality_issue', 'deadline_missed', 'scope_change', 'payment_issue', 'communication_issue', 'other'], 
    required: true 
  },
  
  // Evidence and files
  evidence: [{
    filename: { type: String, required: true },
    ipfsHash: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Status and resolution
  status: { 
    type: String, 
    enum: ['open', 'under_review', 'resolved_client', 'resolved_freelancer', 'resolved_admin', 'closed'], 
    default: 'open' 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  
  // Resolution details
  resolution: {
    type: { type: String, enum: ['client_favor', 'freelancer_favor', 'partial_refund', 'mediation', 'cancelled'] },
    description: { type: String },
    refundAmount: { type: Number, default: 0 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who resolved
    resolvedAt: { type: Date }
  },
  
  // Messages/Communication
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: [{
      filename: { type: String },
      ipfsHash: { type: String }
    }],
    sentAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dispute', disputeSchema);
