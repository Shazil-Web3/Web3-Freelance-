require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');

async function debugApplications() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all applications
    const applications = await Application.find({})
      .populate('freelancer', 'username walletAddress email')
      .populate('job', 'title client');

    console.log('\n=== ALL APPLICATIONS ===');
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`);
      console.log('  ID:', app._id);
      console.log('  Freelancer ID:', app.freelancer?._id);
      console.log('  Freelancer Username:', app.freelancer?.username);
      console.log('  Freelancer Wallet:', app.freelancer?.walletAddress);
      console.log('  Job ID:', app.job?._id);
      console.log('  Job Title:', app.job?.title);
      console.log('  Status:', app.status);
      console.log('  Created:', app.createdAt);
      console.log('---');
    });

    // Get all users
    const users = await User.find({});
    console.log('\n=== ALL USERS ===');
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log('  ID:', user._id);
      console.log('  Username:', user.username);
      console.log('  Wallet:', user.walletAddress);
      console.log('  Role:', user.userRole);
      console.log('  Created:', user.createdAt);
      console.log('---');
    });

    // Check for applications with missing freelancer data
    const appsWithMissingData = applications.filter(app => 
      !app.freelancer || !app.freelancer.walletAddress
    );

    console.log('\n=== APPLICATIONS WITH MISSING FREELANCER DATA ===');
    console.log('Count:', appsWithMissingData.length);
    appsWithMissingData.forEach((app, index) => {
      console.log(`Problem Application ${index + 1}:`);
      console.log('  ID:', app._id);
      console.log('  Freelancer (raw):', app.freelancer);
      console.log('  Job:', app.job?.title);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

debugApplications();
