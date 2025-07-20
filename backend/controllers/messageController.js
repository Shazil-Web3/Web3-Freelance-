const Message = require('../models/Message');

// Send a message in a job thread
exports.sendMessage = async (req, res) => {
  try {
    const { jobId, content } = req.body;
    const sender = req.user.id;
    const msg = await Message.create({ job: jobId, sender, content });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List messages for a job
exports.listMessages = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const msgs = await Message.find({ job: jobId }).populate('sender');
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 