const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { verifySignature } = require('../utils/web3Utils');

// In-memory nonce store (for demo; use Redis in production)
const nonces = {};

// 1. Generate nonce for wallet
exports.getNonce = async (req, res) => {
  const { wallet } = req.params;
  if (!wallet) return res.status(400).json({ message: 'Wallet required' });
  const nonce = Math.floor(Math.random() * 1e9).toString();
  nonces[wallet.toLowerCase()] = nonce;
  res.json({ nonce });
};

// 2. Verify signature and authenticate
exports.verifySignature = async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !signature) return res.status(400).json({ message: 'Wallet and signature required' });
  const nonce = nonces[wallet.toLowerCase()];
  if (!nonce) return res.status(400).json({ message: 'Nonce not found' });
  const valid = verifySignature(wallet, signature, nonce);
  if (!valid) return res.status(401).json({ message: 'Invalid signature' });
  // Upsert user
  let user = await User.findOne({ walletAddress: wallet.toLowerCase() });
  if (!user) {
    user = await User.create({ walletAddress: wallet.toLowerCase(), userRole: 'client' });
    console.log(`New user created: wallet=${wallet.toLowerCase()}, id=${user._id}`);
  }
  // Issue JWT
  const token = generateToken({ wallet: user.walletAddress, id: user._id });
  delete nonces[wallet.toLowerCase()];
  res.json({ token, user });
};

// 3. Validate JWT token
exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
