const express = require('express');
const router = express.Router();
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');

// Debug endpoint to test application data structure
router.get('/debug/applications/:wallet', async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    const user = await User.findOne({ walletAddress: wallet });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get applications received (if client)
    const applicationsReceived = await Application.find({})
      .populate({ path: 'job', match: { client: user._id } })
      .populate({
        path: 'freelancer',
        select: 'username walletAddress email userRole createdAt',
        model: 'User'
      });
    
    // Filter out applications where job is null (doesn't match client)
    const validApplicationsReceived = applicationsReceived.filter(app => app.job !== null);
    
    console.log('DEBUG ENDPOINT: Applications for client:', user.walletAddress);
    console.log('DEBUG ENDPOINT: Valid applications count:', validApplicationsReceived.length);
    
    const debugData = validApplicationsReceived.map((app, index) => {
      console.log(`DEBUG ENDPOINT Application ${index + 1}:`, {
        appId: app._id,
        jobTitle: app.job?.title,
        freelancerId: app.freelancer?._id,
        freelancerWallet: app.freelancer?.walletAddress,
        freelancerType: typeof app.freelancer,
        hasWalletAddress: !!app.freelancer?.walletAddress,
        status: app.status
      });
      
      return {
        _id: app._id,
        job: {
          _id: app.job?._id,
          title: app.job?.title,
          contractJobId: app.job?.contractJobId
        },
        freelancer: {
          _id: app.freelancer?._id,
          username: app.freelancer?.username,
          walletAddress: app.freelancer?.walletAddress,
          email: app.freelancer?.email
        },
        proposal: app.proposal,
        fee: app.fee,
        status: app.status
      };
    });
    
    res.json({
      message: 'Debug data for applications',
      user: {
        _id: user._id,
        walletAddress: user.walletAddress,
        username: user.username
      },
      applicationsReceived: debugData
    });
    
  } catch (error) {
    console.error('DEBUG ENDPOINT Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
