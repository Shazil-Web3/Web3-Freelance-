"use client"
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import JobAsCrewOneContext from '@/context/Rcontext';
import { useWalletAuth } from '@/components/WalletAuthProvider';

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
  const { user, token, loading: authLoading } = useWalletAuth();
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
    if (user && token) fetchJobs();
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

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setProposal('');
    setBidAmount('');
    setApplyError('');
    setShowModal(true);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError('');
    try {
      if (!contract) throw new Error('Contract not ready.');
      if (!user || !token) throw new Error('Connect your wallet to apply.');
      if (!proposal || !bidAmount) throw new Error('Proposal and bid amount required.');
      // Ensure bidAmount is a string number, not a hex string
      const numericBidAmount = Number(bidAmount);
      if (isNaN(numericBidAmount) || numericBidAmount <= 0) throw new Error('Bid amount must be a valid number.');
      // Convert jobId to a number (assume jobs are indexed by array index or backend should provide a numeric jobId for the contract)
      let jobId = selectedJob.jobId || selectedJob.contractId || selectedJob.id || selectedJob._id;
      if (typeof jobId === 'string' && !/^[0-9]+$/.test(jobId)) {
        throw new Error('This job cannot be applied to on-chain: jobId is not a numeric contract jobId.');
      }
      jobId = Number(jobId);
      if (isNaN(jobId)) throw new Error('Invalid jobId for contract.');
      await contract.applyToProject(jobId, proposal, numericBidAmount.toString());
      setApplySuccess(true);
      setShowModal(false);
    } catch (err) {
      setApplyError(err.message || 'Failed to apply.');
    } finally {
      setApplyLoading(false);
    }
  };

  // Only show jobs that are open and not posted by the current user
  const filteredJobs = jobs.filter(job => job.status === 'open' && (!user || job.client?._id !== user._id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 px-12 lg:px-28">
        <section className="py-20 relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-background to-accent/20" />
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
              <div className="text-center text-muted-foreground py-20">No jobs available to apply for at the moment.</div>
            ) : (
              <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-2">
                {filteredJobs.map(job => (
                  <div key={job._id} className="card-floating p-8 bg-white/90 rounded-3xl shadow-2xl border border-success/20 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1 text-success">{job.title}</h2>
                        <div className="text-muted-foreground text-base mb-1">Client: <span className="font-semibold">{job.client?.username || job.client?.walletAddress?.slice(0, 8) + '...'}</span></div>
                        <div className="text-muted-foreground text-base">Deadline: <span className="font-semibold">{formatDeadline(job.deadline)}</span></div>
                      </div>
                    </div>
                    {Array.isArray(job.milestones) && job.milestones.length > 0 && (
                      <div className="mt-2">
                        <div className="font-semibold text-lg mb-2 text-gradient-green">Milestones</div>
                        <ol className="space-y-3">
                          {job.milestones.map((ms, i) => (
                            <li key={i} className="flex items-center gap-4 bg-success/5 rounded-xl px-4 py-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-success/80 text-white font-bold text-lg">{i+1}</span>
                              <div className="flex-1">
                                <div className="font-medium text-success text-base">{ms.title || ms.description}</div>
                                <div className="text-accent font-semibold text-lg">{ms.amount} ETH</div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <button
                      className="btn-primary w-full py-3 text-lg font-semibold rounded-xl mt-4"
                      onClick={() => handleApplyClick(job)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
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

