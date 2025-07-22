"use client"
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import JobAsCrewOneContext from '@/context/Rcontext';

// You may want to set this from env or config
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE';

const initialMilestone = { description: '', amount: '' };

const PostAJobPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    title: '',
    deadline: '',
    milestones: [{ ...initialMilestone }],
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(true);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMilestoneChange = (idx, e) => {
    const milestones = [...form.milestones];
    milestones[idx][e.target.name] = e.target.value;
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
      // Validate fields
      if (!form.title || !form.deadline || form.milestones.some(m => !m.description || !m.amount)) {
        setError('Please fill all fields.');
        setLoading(false);
        return;
      }
      // Convert deadline to uint256 (seconds since epoch)
      const deadlineTimestamp = Math.floor(new Date(form.deadline).getTime() / 1000);
      // Ensure milestone amounts are strings (ETH)
      const milestones = form.milestones.map(m => ({ ...m, amount: m.amount.toString() }));
      // Call contract
      const result = await contract.createJob(form.title, milestones, deadlineTimestamp);
      setTxHash(result.transactionHash);
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 px-4 lg:px-28">
        {contractLoading ? (
          <div className="flex justify-center items-center h-96">
            <span className="text-lg text-muted-foreground">Loading contract...</span>
          </div>
        ) : (
          <>
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
                  <div className="mb-4 break-all">
                    <span className="font-semibold">Transaction Hash:</span><br />
                    <span className="text-xs">{txHash}</span>
                  </div>
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
  );
};

export default PostAJobPage;

