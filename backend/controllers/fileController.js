const { uploadToIPFS, getIpfsUrl } = require('../utils/ipfs');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const hash = await uploadToIPFS(req.file.buffer);
    const url = getIpfsUrl(hash);
    res.json({ hash, url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 