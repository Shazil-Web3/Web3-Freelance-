const { uploadToIPFS } = require('../utils/ipfs');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = await uploadToIPFS(req.file.buffer);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 