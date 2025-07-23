"use client"
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import JobAsCrewOneContext from '@/context/Rcontext';
import { useWalletAuth } from '@/components/WalletAuthProvider';
import { FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaStar, FaTasks } from 'react-icons/fa';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const initialMilestone = { title: '', description: '', amount: '' };

function formatDeadline(deadline) {
  if (!deadline) return 'N/A';
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
      if (!form.title || !form.deadline || form.milestones.some(m => !m.description || !m.amount)) {
        setError('Please fill all fields.');
        setLoading(false);
        return;
      }
      const milestones = form.milestones.map(m => ({
        title: m.description,
        description: m.description,
        amount: m.amount.toString()
      }));
      // Handle deadline conversion properly - ensure proper timezone handling
      const now = Date.now();
      const selectedDeadline = new Date(form.deadline + 'T00:00:00.000Z'); // Ensure UTC interpretation
      
      // Ensure the selected deadline is not in the past
      if (selectedDeadline.getTime() <= now) {
        setError('Deadline must be in the future.');
        setLoading(false);
        return;
      }
      
      // Add time buffer to avoid immediate expiration (set deadline to end of selected day in UTC)
      const endOfDay = new Date(selectedDeadline);
      endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of the selected day in UTC
      
      const deadlineTimestamp = Math.floor(endOfDay.getTime() / 1000);
      const currentTimestamp = Math.floor(now / 1000);
      
      // Validation: ensure deadline timestamp is reasonable (not too far in future, not in past)
      const minTimestamp = currentTimestamp;
      const maxTimestamp = currentTimestamp + (365 * 24 * 60 * 60); // 1 year from now
      
      if (deadlineTimestamp < minTimestamp) {
        setError('Deadline timestamp is in the past. This should not happen.');
        setLoading(false);
        return;
      }
      
      if (deadlineTimestamp > maxTimestamp) {
        setError('Deadline is too far in the future (max 1 year).');
        setLoading(false);
        return;
      }
      
      console.log('Current time:', new Date(now).toISOString());
      console.log('Selected deadline:', selectedDeadline.toISOString());
      console.log('End of day deadline:', endOfDay.toISOString());
      console.log('Current timestamp (seconds):', currentTimestamp);
      console.log('Deadline timestamp (seconds):', deadlineTimestamp);
      console.log('Time difference (seconds):', deadlineTimestamp - currentTimestamp);
      
      // Create job on blockchain and get the contract job ID
      const result = await contract.createJob(form.title, milestones, deadlineTimestamp);
      
      // Extract contractJobId from the result
      let contractJobId = null;
      if (result && result.success && typeof result.jobId === 'number') {
        contractJobId = result.jobId;
      } else {
        setError('Failed to get contract jobId from blockchain. Transaction may have failed.');
        setLoading(false);
        return;
      }
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
          deadline: new Date(form.deadline).toISOString(),
          client: user._id,
          description: jobDescription,
          contractJobId: contractJobId // Always a number
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
      {/* Glow orbs with green and orange gradients */}
      <div className="absolute top-[-10rem] left-[-16rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.32)_0%,_transparent_70%)] z-0" />
      <div className="absolute bottom-[-8rem] right-1/3 w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.28)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-[-6rem] right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] z-0" />
      <div className="absolute bottom-1/3 left-[-10rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] z-0" />
      
      {/* New middle positioned orbs */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.15)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.12)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-2/3 right-1/4 w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] z-0" />
      <div className="absolute top-1/4 left-1/4 w-[22rem] h-[22rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] z-0" />
      
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
                <section className="py-20 relative overflow-hidden w-full">
                  <div className="container mx-auto relative z-10">
                    <div className="text-center mb-14">
                      <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                        Post a <span className="text-green-600">Job</span>
                      </h1>
                      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Connect with top Web3 talent by posting your project. Find the perfect freelancer for your needs.
                      </p>
                    </div>
                    <div className="grid gap-8 max-w-2xl mx-auto">
                      <div className="p-8 bg-white shadow-lg rounded-2xl">
                        <h2 className="text-2xl font-bold mb-2">How it Works</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                          <li>Describe your project and required skills.</li>
                          <li>Set your budget and timeline.</li>
                          <li>Review applications from vetted freelancers.</li>
                          <li>Hire and collaborate securely via smart contracts.</li>
                        </ul>
                        <button
                          className="mt-6 w-full py-3 text-lg font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700"
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
                    <h1 className="text-5xl lg:text-7xl font-bold text-green-600">Your Jobs</h1>
                    <button
                      className="py-3 px-8 text-xl font-semibold bg-green-600 text-white rounded-2xl shadow-lg hover:bg-green-700"
                      onClick={() => setShowModal(true)}
                    >
                      + Post Job
                    </button>
                  </div>
                  <div className="grid gap-6">
                    {jobs.map(job => (
                      <div
                        key={job._id}
                        className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md card-floating transition-shadow duration-300 hover:shadow-2xl hover:border-green-400 group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-green-700 flex items-center mb-2">
                              <FaStar className="mr-2 text-yellow-500" /> Title: {job.title}
                            </h2>
                            <div className="text-gray-600 flex items-center mt-2 text-lg">
                              <FaClock className="mr-2" /> Status: <span className="font-medium text-orange-600 ml-1">{job.status || 'open'}</span>
                            </div>
                            <div className="text-gray-600 flex items-center mt-1 text-lg">
                              <FaClock className="mr-2" /> Deadline: <span className="font-medium ml-1">{formatDeadline(job.deadline)}</span>
                            </div>
                            {Array.isArray(job.milestones) && job.milestones.length > 0 && (
                              <div className="mt-4">
                                <h3 className="text-lg font-semibold text-green-700 flex items-center mb-2">
                                  <FaTasks className="mr-2 text-green-600" /> Milestones
                                </h3>
                                <div className="mt-2 space-y-2">
                                  {job.milestones.map((ms, i) => (
                                    <div key={i} className="flex flex-col md:flex-row md:items-center md:gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 group-hover:border-green-200 transition">
                                      <span className="text-gray-700 font-medium text-base flex-1">{ms.title || ms.description}</span>
                                      <span className="text-orange-600 font-semibold text-base mt-1 md:mt-0 flex items-center">
                                        <FaTasks className="mr-1 text-green-500" /> {ms.amount} ETH
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-yellow-500 font-bold text-xl">4.9 ★</span>
                            <p className="text-gray-500 text-sm mt-1">$900K+ spent</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
                          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                        <small className="text-gray-500 text-sm mt-1 block">
                          Deadline must be at least tomorrow to give freelancers time to apply
                        </small>
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
                          className="text-green-600 mt-2 text-sm underline"
                          onClick={addMilestone}
                        >
                          + Add Milestone
                        </button>
                      </div>
                      {error && <div className="text-red-500 text-sm">{error}</div>}
                      <button
                        type="submit"
                        className="w-full py-3 text-lg font-semibold bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700"
                        disabled={loading}
                      >
                        {loading ? 'Posting...' : 'Create Job'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
              {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-fade-in">
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Job Created Successfully!</h2>
                    <p className="mb-4">Your job has been posted and escrowed on-chain.</p>
                    <button
                      className="w-full py-3 text-lg font-semibold bg-green-600 text-white rounded-xl"
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