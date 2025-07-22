"use client"
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import JobAsCrewOneContext from '@/context/Rcontext';
import { useWalletAuth } from '@/components/WalletAuthProvider';

// You may want to set this from env or config
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const initialMilestone = { title: '', description: '', amount: '' };

// Helper to format deadline
function formatDeadline(deadline) {
  if (!deadline) return 'N/A';
  // Accepts both Date and uint256 (seconds)
  let d = typeof deadline === 'string' && !isNaN(Date.parse(deadline))
    ? new Date(deadline)
    : new Date(Number(deadline) * 1000);
  return isNaN(d) ? 'N/A' : d.toLocaleDateString();
}

const PostAJobPage = () => {
  const { user, token, loading: authLoading } = useWalletAuth();
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    deadline: '',
    milestones: [{ ...initialMilestone }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

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
    // eslint-disable-next-line
  }, [user, token]);

  async function fetchJobs() {
    setJobsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs?client=${user._id}`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMilestoneChange = (idx, e) => {
    const milestones = [...form.milestones];
    milestones[idx][e.target.name] = e.target.value;
    // If editing description, also update title for backend compatibility
    if (e.target.name === 'description') milestones[idx].title = e.target.value;
    setForm({ ...form, milestones });
  };

  const addMilestone = () => {
    setForm({ ...form, milestones: [...form.milestones, { ...initialMilestone }] });
  };

  const removeMilestone = (idx) => {
    const milestones = form.milestones.filter((_, i) => i !== idx);
    setForm({ ...form, milestones });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!contract) {
        setError('Contract not ready.');
        setLoading(false);
        return;
      }
      if (!user || !token) {
        setError('You need to connect your wallet first.');
        setLoading(false);
        return;
      }
      // Validate fields
      if (!form.title || !form.deadline || form.milestones.some(m => !m.description || !m.amount)) {
        setError('Please fill all fields.');
        setLoading(false);
        return;
      }
      // Prepare milestones for both contract and backend
      const milestones = form.milestones.map(m => ({
        title: m.description, // Use description as title for backend
        description: m.description,
        amount: m.amount.toString()
      }));
      // Send deadline as ISO string to backend, timestamp to contract
      const deadlineTimestamp = Math.floor(new Date(form.deadline).getTime() / 1000);
      // Call contract
      const result = await contract.createJob(form.title, milestones, deadlineTimestamp);
      // Extract contract jobId from the transaction result (if available)
      let contractJobId = null;
      if (result && result.transactionHash) {
        // Try to get jobId from event logs (ethers v6)
        if (result.events && result.events.length > 0) {
          const jobCreatedEvent = result.events.find(e => e.event === 'JobCreated');
          if (jobCreatedEvent && jobCreatedEvent.args && jobCreatedEvent.args.jobId !== undefined) {
            contractJobId = Number(jobCreatedEvent.args.jobId);
          }
        }
      }
      // Save job to backend
      const jobDescription = milestones.map(m => m.description).join(' | ');
      const backendRes = await fetch(`${BACKEND_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          milestones,
          deadline: new Date(form.deadline).toISOString(), // ISO string for backend
          client: user._id,
          description: jobDescription,
          contractJobId // Send contract jobId to backend
        })
      });
      if (!backendRes.ok) {
        const data = await backendRes.json();
        throw new Error(data.message || 'Failed to save job in backend');
      }
      await fetchJobs();
      setShowModal(false);
      setShowSuccess(true);
      setForm({ title: '', deadline: '', milestones: [{ ...initialMilestone }] });
    } catch (err) {
      setError(err.message || 'Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Green and orange orb gradients for background, like landing/hero */}
      <div className="absolute top-[-10rem] left-[-16rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.32)_0%,_transparent_70%)] z-0" />
      <div className="absolute bottom-[-8rem] right-[-20rem] w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.28)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-1/3 right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] z-0" />
      <div className="absolute bottom-1/4 left-[-10rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] z-0" />
      {/* Large, centered dark orb for dramatic effect */}
      <div className="absolute top-1/2 left-1/2 w-[48rem] h-[48rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_80%)] -translate-x-1/2 -translate-y-1/2 z-0" />
      {/* Darker main gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-success/40 via-background/80 to-accent/40 z-0" />
      <div className="relative z-10">
        <Header />
        <main className="pt-20 px-4 lg:px-28">
          {authLoading || contractLoading ? (
            <div className="flex justify-center items-center h-96">
              <span className="text-lg text-muted-foreground">Loading...</span>
            </div>
          ) : !user || !token ? (
            <div className="flex flex-col items-center justify-center h-96">
              <span className="text-lg text-muted-foreground mb-4">Connect your wallet to post a job.</span>
            </div>
          ) : (
            <>
              {jobsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <span className="text-lg text-muted-foreground">Loading jobs...</span>
                </div>
              ) : jobs.length === 0 ? (
                // Show intro and how it works only if no jobs exist
                <section className="py-20 relative overflow-hidden w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-background to-accent/20" />
                  <div className="container mx-auto relative z-10">
                    <div className="text-center mb-14">
                      <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                        Post a <span className="text-gradient-green">Job</span>
                      </h1>
                      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Connect with top Web3 talent by posting your project. Find the perfect freelancer for your needs.
                      </p>
                    </div>
                    <div className="grid gap-8 max-w-2xl mx-auto">
                      <div className="card-floating p-8 bg-white/80 shadow-lg rounded-2xl">
                        <h2 className="text-2xl font-bold mb-2">How it Works</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                          <li>Describe your project and required skills.</li>
                          <li>Set your budget and timeline.</li>
                          <li>Review applications from vetted freelancers.</li>
                          <li>Hire and collaborate securely via smart contracts.</li>
                        </ul>
                        <button
                          className="mt-6 btn-primary w-full py-3 text-lg font-semibold rounded-xl"
                          onClick={() => setShowModal(true)}
                        >
                          Start Posting
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="w-full">
                  <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-bold text-gradient-green">Your Jobs</h1>
                    <button
                      className="btn-primary py-3 px-8 text-xl font-semibold rounded-2xl shadow-lg"
                      onClick={() => setShowModal(true)}
                    >
                      + Post Job
                    </button>
                  </div>
                  <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-2">
                    {jobs.map(job => (
                      <div key={job._id} className="card-floating p-8 bg-white/90 rounded-3xl shadow-2xl border border-success/20 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-bold mb-1 text-success">{job.title}</h2>
                            <div className="text-muted-foreground text-base mb-1">Status: <span className="font-semibold text-gradient-orange">{job.status || 'open'}</span></div>
                            <div className="text-muted-foreground text-base">Deadline: <span className="font-semibold">{formatDeadline(job.deadline)}</span></div>
                          </div>
                        </div>
                        {Array.isArray(job.milestones) && job.milestones.length > 0 && (
                          <div className="mt-2">
                            <div className="font-semibold text-lg mb-2 text-gradient-green">Milestones</div>
                            <div className="grid gap-3">
                              {job.milestones.map((ms, i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center md:justify-between bg-success/5 rounded-xl px-4 py-3">
                                  <div className="font-medium text-success">{ms.title || ms.description}</div>
                                  <div className="text-accent font-semibold text-lg">{ms.amount} ETH</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Modal for job posting form */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative animate-fade-in">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                      onClick={() => setShowModal(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h2 className="text-2xl font-bold mb-4">Post a Job</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block font-medium mb-1">Job Title</label>
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Deadline</label>
                        <input
                          type="date"
                          name="deadline"
                          value={form.deadline}
                          onChange={handleChange}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">Milestones</label>
                        {form.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex gap-2 mb-2 items-center">
                            <input
                              type="text"
                              name="description"
                              placeholder="Milestone description"
                              value={milestone.description}
                              onChange={e => handleMilestoneChange(idx, e)}
                              className="flex-1 border rounded-lg px-3 py-2"
                              required
                            />
                            <input
                              type="number"
                              name="amount"
                              placeholder="ETH"
                              min="0"
                              step="0.0001"
                              value={milestone.amount}
                              onChange={e => handleMilestoneChange(idx, e)}
                              className="w-32 border rounded-lg px-3 py-2"
                              required
                            />
                            {form.milestones.length > 1 && (
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700 text-xl px-2"
                                onClick={() => removeMilestone(idx)}
                                aria-label="Remove milestone"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-primary mt-2 text-sm underline"
                          onClick={addMilestone}
                        >
                          + Add Milestone
                        </button>
                      </div>
                      {error && <div className="text-red-500 text-sm">{error}</div>}
                      <button
                        type="submit"
                        className="btn-primary w-full py-3 text-lg font-semibold rounded-xl flex items-center justify-center"
                        disabled={loading}
                      >
                        {loading ? 'Posting...' : 'Create Job'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
              {/* Success Modal (Window 23) */}
              {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-fade-in">
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Job Created Successfully!</h2>
                    <p className="mb-4">Your job has been posted and escrowed on-chain.</p>
                    <button
                      className="btn-primary w-full py-3 text-lg font-semibold rounded-xl"
                      onClick={() => setShowSuccess(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default PostAJobPage;

