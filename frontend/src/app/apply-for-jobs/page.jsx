"use client"
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import JobAsCrewOneContext from '@/context/Rcontext';
import { useWalletAuth } from '@/components/WalletAuthProvider';
import DeadlineChecker from '@/components/DeadlineChecker';
import { 
  FaBriefcase, 
  FaClock, 
  FaUser, 
  FaEthereum, 
  FaTasks, 
  FaCalendarAlt,
  FaCheckCircle,
  FaPaperPlane,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function formatDeadline(deadline) {
  if (!deadline) return 'N/A';
  let d = typeof deadline === 'string' && !isNaN(Date.parse(deadline))
    ? new Date(deadline)
    : new Date(Number(deadline) * 1000);
  return isNaN(d) ? 'N/A' : d.toLocaleDateString();
}

const ApplyForJobsPage = () => {
  const { user, token, loading: authLoading, reAuthenticate } = useWalletAuth();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [userApplications, setUserApplications] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function initContract() {
      setContractLoading(true);
      try {
        const ctx = await JobAsCrewOneContext.createAsync(CONTRACT_ADDRESS, window.ethereum);
        if (mounted) setContract(ctx);
      } catch (err) {
        setError('Failed to initialize contract: ' + err.message);
      } finally {
        setContractLoading(false);
      }
    }
    if (typeof window !== 'undefined' && window.ethereum) {
      initContract();
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchJobs();
      fetchUserApplications();
    }
  }, [user, token]);

  async function fetchJobs() {
    setJobsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }

  async function fetchUserApplications() {
    if (!user?._id || !token) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/applications?freelancer=${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Fetch applications response status:', res.status);
      console.log('Fetch applications response headers:', res.headers);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Backend error response:', errorText);
        setUserApplications([]);
        return;
      }
      
      const data = await res.json();
      setUserApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch user applications:', err);
      console.error('Error details:', err.message);
      setUserApplications([]);
    }
  }

  // Check if user has already applied to a job
  const hasUserApplied = (jobId) => {
    return userApplications.some(app => app.job === jobId || app.job?._id === jobId);
  };

  // Get application status for a job
  const getApplicationStatus = (jobId) => {
    const application = userApplications.find(app => app.job === jobId || app.job?._id === jobId);
    return application?.status || null;
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setProposal('');
    setBidAmount('');
    setApplyError('');
    setShowModal(true);
  };

  const ensureWalletConnection = async () => {
    // Check if wallet is still connected
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access if needed
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        // Request wallet connection
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      
      // Re-initialize contract with fresh signer if needed
      if (!contract || !contract.signer) {
        const newContract = await JobAsCrewOneContext.createAsync(CONTRACT_ADDRESS, window.ethereum);
        setContract(newContract);
        return newContract;
      }
      
      return contract;
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw new Error('Please connect your wallet and try again.');
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError('');
    try {
      if (!user || !token) throw new Error('Connect your wallet to apply.');
      if (!proposal || !bidAmount) throw new Error('Proposal and bid amount required.');
      
      // Ensure wallet is properly connected
      const activeContract = await ensureWalletConnection();
      
      // Get the contract job ID - this must be a valid number from the smart contract
      let jobId = selectedJob.contractJobId;
      
      // Validate that we have a valid contract job ID
      if (typeof jobId === 'undefined' || jobId === null || jobId === '') {
        throw new Error('This job cannot be applied to: missing contract job ID. The job may not have been properly created on-chain.');
      }
      
      // Convert to number and validate
      jobId = Number(jobId);
      if (isNaN(jobId) || jobId < 0) {
        throw new Error('Invalid contract job ID. This job cannot be applied to on-chain.');
      }
      
      // Check if deadline has passed on the client side first
      const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      
      // Get deadline from blockchain directly to ensure accuracy
      const contractJob = await activeContract.getJob(jobId);
      const blockchainDeadline = Number(contractJob.deadline);
      
      console.log('=== DEBUG DEADLINE CHECK ===');
      console.log('Job ID:', jobId);
      console.log('Selected Job from DB:', selectedJob);
      console.log('Contract Job from Blockchain:', contractJob);
      console.log('---');
      console.log('Current timestamp:', now);
      console.log('Blockchain deadline timestamp:', blockchainDeadline);
      console.log('DB deadline (original):', selectedJob.deadline);
      console.log('---');
      console.log('Current date:', new Date(now * 1000).toISOString());
      console.log('Blockchain deadline date:', new Date(blockchainDeadline * 1000).toISOString());
      console.log('DB deadline date:', new Date(selectedJob.deadline).toISOString());
      console.log('---');
      console.log('Time difference (seconds):', blockchainDeadline - now);
      console.log('Is deadline zero/invalid?', blockchainDeadline === 0 || blockchainDeadline < 1000000000);
      console.log('===============================');
      
      if (now > blockchainDeadline) {
        throw new Error(`This job's deadline has passed. Current: ${new Date(now * 1000).toLocaleString()}, Deadline: ${new Date(blockchainDeadline * 1000).toLocaleString()}`);
      }
      
      // Ensure bidAmount is a string number, not a hex string
      const numericBidAmount = Number(bidAmount);
      if (isNaN(numericBidAmount) || numericBidAmount <= 0) throw new Error('Bid amount must be a valid number.');
      
      // Apply on blockchain with retry mechanism
      try {
        await activeContract.applyToProject(jobId, proposal, numericBidAmount.toString());
      } catch (contractError) {
        console.error('Contract error:', contractError);
        // If it's an authorization error, try to reconnect wallet
        if (contractError.code === 4100 || contractError.message.includes('unauthorized') || contractError.message.includes('not been authorized')) {
          // Try to reconnect and retry once
          const reconnectedContract = await ensureWalletConnection();
          await reconnectedContract.applyToProject(jobId, proposal, numericBidAmount.toString());
        } else {
          throw contractError;
        }
      }
      
      // Create application record in database
      console.log('Creating application with data:', {
        job: selectedJob._id,
        freelancer: user._id,
        proposal: proposal,
        fee: numericBidAmount,
        status: 'pending'
      });
      
      const applicationRes = await fetch(`${BACKEND_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job: selectedJob._id,
          freelancer: user._id,
          proposal: proposal,
          fee: numericBidAmount,
          status: 'pending'
        })
      });
      
      console.log('Application creation response status:', applicationRes.status);
      
      if (!applicationRes.ok) {
        const errorText = await applicationRes.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Failed to save application: ${applicationRes.status} ${applicationRes.statusText}`);
      }
      
      // Refresh applications list
      await fetchUserApplications();
      
      setApplySuccess(true);
      setShowModal(false);
    } catch (err) {
      console.error('Application error:', err);
      let errorMessage = err.message || 'Failed to apply.';
      
      // Provide user-friendly error messages
      if (err.code === 4100) {
        errorMessage = 'Wallet authorization required. Please check your wallet and approve the transaction.';
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again and approve the transaction in your wallet.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in your wallet to complete this transaction.';
      } else if (err.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setApplyError(errorMessage);
    } finally {
      setApplyLoading(false);
    }
  };

  // Only show jobs that are open and not posted by the current user
  const filteredJobs = jobs.filter(job => job.status === 'open' && (!user || job.client?._id !== user._id));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Glow orbs with green and orange gradients - similar to post-a-job page */}
      <div className="absolute top-[-10rem] left-[-16rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.32)_0%,_transparent_70%)] z-0" />
      <div className="absolute bottom-[-8rem] right-1/3 w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.28)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-[-6rem] right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] z-0" />
      <div className="absolute bottom-1/3 left-[-10rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] z-0" />
      
      {/* Middle positioned orbs */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.15)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.12)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-2/3 right-1/4 w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-1/4 left-1/4 w-[22rem] h-[22rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] z-0" />
      
      <Header />
      <main className="pt-20 px-12 lg:px-28">
        <section className="py-20 relative overflow-hidden w-full">
          {/* Remove this smooth gradient background */}
          {/* <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-background to-accent/20" /> */}
          <div className="container mx-auto relative z-10">
            <div className="text-center mb-14">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                Apply for a <span className="text-gradient-green">Job</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover exciting Web3 projects and take the next step in your freelance career.
              </p>
            </div>
            {authLoading || contractLoading ? (
              <div className="flex justify-center items-center h-96">
                <span className="text-lg text-muted-foreground">Loading...</span>
              </div>
            ) : !user || !token ? (
              <div className="flex flex-col items-center justify-center h-96">
                <span className="text-lg text-muted-foreground mb-4">Connect your wallet to apply for jobs.</span>
              </div>
            ) : jobsLoading ? (
              <div className="flex justify-center items-center h-32">
                <span className="text-lg text-muted-foreground">Loading jobs...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <>
                <DeadlineChecker />
                <div className="text-center text-muted-foreground py-20">No jobs available to apply for at the moment.</div>
              </>
            ) : (
              <>
                <DeadlineChecker />
              <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                {filteredJobs.map(job => {
                  const userApplied = hasUserApplied(job._id);
                  const applicationStatus = getApplicationStatus(job._id);
                  const totalBudget = Array.isArray(job.milestones) ? job.milestones.reduce((sum, ms) => sum + parseFloat(ms.amount || 0), 0) : 0;
                  
                  return (
                    <div key={job._id} className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-green-300">
                      {/* Header with job title and client info */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <FaBriefcase className="text-green-600 text-lg" />
                              </div>
                              <h2 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                                {job.title}
                              </h2>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <FaUser className="text-gray-400" />
                                <span>{job.client?.username || job.client?.walletAddress?.slice(0, 8) + '...'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaCalendarAlt className="text-gray-400" />
                                <span>{formatDeadline(job.deadline)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Application status indicator */}
                          {userApplied && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              <FaCheckCircle className="text-xs" />
                              <span>Applied</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Job description if available */}
                        {job.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {job.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Milestones section */}
                      {Array.isArray(job.milestones) && job.milestones.length > 0 && (
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-center gap-2 mb-4">
                            <FaTasks className="text-green-600" />
                            <span className="font-semibold text-gray-800">Milestones ({job.milestones.length})</span>
                          </div>
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {job.milestones.map((ms, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white font-bold text-xs flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800 text-sm truncate">
                                    {ms.title || ms.description}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <FaEthereum className="text-blue-500 text-xs" />
                                    <span className="text-blue-600 font-semibold text-sm">{ms.amount} ETH</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Footer with budget and apply button */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <FaEthereum className="text-blue-500" />
                            <span className="text-lg font-bold text-gray-800">
                              {totalBudget.toFixed(4)} ETH
                            </span>
                            <span className="text-sm text-gray-500">Total Budget</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <FaClock className="text-xs" />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {userApplied ? (
                          <div className="w-full">
                            <button 
                              className="w-full py-3 px-4 bg-green-100 text-green-700 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                              disabled
                            >
                              <FaCheckCircle />
                              <span>Applied ({applicationStatus || 'pending'})</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(job)}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group"
                          >
                            <FaPaperPlane className="group-hover:translate-x-1 transition-transform" />
                            <span>Apply Now</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-blue-500/0 group-hover:from-green-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
                    </div>
                  );
                })}
              </div>
              </>
            )}
            {/* Modal for applying to a job */}
            {showModal && selectedJob && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 className="text-2xl font-bold mb-4">Apply for: {selectedJob.title}</h2>
                  <form onSubmit={handleApply} className="space-y-6">
                    <div>
                      <label className="block font-medium mb-1">Proposal</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        value={proposal}
                        onChange={e => setProposal(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Bid Amount (ETH)</label>
                      <input
                        type="number"
                        className="w-full border rounded-lg px-3 py-2"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        min="0"
                        step="0.0001"
                        required
                      />
                    </div>
                    {applyError && <div className="text-red-500 text-sm">{applyError}</div>}
                    <button
                      type="submit"
                      className="btn-primary w-full py-3 text-lg font-semibold rounded-xl flex items-center justify-center"
                      disabled={applyLoading}
                    >
                      {applyLoading ? 'Applying...' : 'Submit Application'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            {/* Success Modal */}
            {applySuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-green-600">Application Submitted!</h2>
                  <p className="mb-4">Your application has been submitted on-chain.</p>
                  <button
                    className="btn-primary w-full py-3 text-lg font-semibold rounded-xl"
                    onClick={() => setApplySuccess(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ApplyForJobsPage;

