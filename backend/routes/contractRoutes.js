const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Store smart contract tx hash
router.post('/tx', authenticateJWT, contractController.storeTx);
// Update escrow status
router.post('/escrow', authenticateJWT, contractController.updateEscrowStatus);
// Verify tx (stub)
router.get('/verify/:txHash', contractController.verifyTx);

module.exports = router; 