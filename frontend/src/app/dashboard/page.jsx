"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWalletAuth } from "@/components/WalletAuthProvider";
import {
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Star,
  Calendar,
  ChevronRight
} from "lucide-react";
import JobAsCrewOneContext from '@/context/Rcontext';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { user, token, loading: authLoading } = useWalletAuth();
  const [userType, setUserType] = useState('freelancer');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [jobSubmissions, setJobSubmissions] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const router = useRouter();
  const [contractCtx, setContractCtx] = useState(null);

  if (typeof window !== 'undefined') {
    console.log('DASHBOARD DEBUG:', { user, token, authLoading });
    console.log('DASHBOARD: user=', user);
    console.log('DASHBOARD: token=', token);
    console.log('DASHBOARD: loading=', authLoading);
  }

  useEffect(() => {
    if (user && user.walletAddress && token) {
      console.log('DASHBOARD: Calling fetchDashboard');
      fetchDashboard();
    }
  }, [user, token]);

  useEffect(() => {
    async function initContract() {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && user && token) {
        const ctx = await JobAsCrewOneContext.createAsync(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, window.ethereum);
        setContractCtx(ctx);
      }
    }
    initContract();
  }, [user, token]);

  useEffect(() => {
    if (userType === 'client' && getOngoingJobsClient().length > 0 && token) {
      getOngoingJobsClient().forEach(async (job) => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/submissions/${job._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setJobSubmissions(prev => ({ ...prev, [job._id]: data.submission }));
          } else {
            setJobSubmissions(prev => ({ ...prev, [job._id]: null }));
          }
        } catch {
          setJobSubmissions(prev => ({ ...prev, [job._id]: null }));
        }
      });
    }
  }, [userType, dashboardData, token]);

  async function fetchDashboard() {
    setDashboardLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${user.walletAddress}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        console.error('DASHBOARD: fetchDashboard failed with status', res.status);
        throw new Error('Failed to fetch dashboard');
      }
      const data = await res.json();
      console.log('DASHBOARD: fetchDashboard success', data);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }

  async function handleApplicationAction(appId, status) {
    setActionLoading(prev => ({ ...prev, [appId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update application');
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to update application');
    } finally {
      setActionLoading(prev => ({ ...prev, [appId]: false }));
    }
  }

  async function handleFileUpload(event, jobId) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setActionLoading(prev => ({ ...prev, [`upload-${jobId}`]: true }));
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('description', 'Project files uploaded by freelancer');

      const res = await fetch(`${BACKEND_URL}/api/submissions/${jobId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload files');
      const data = await res.json();
      alert('Files uploaded successfully to IPFS!');
      setUploadedFiles(prev => ({ ...prev, [jobId]: true }));
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to upload files');
    } finally {
      setActionLoading(prev => ({ ...prev, [`upload-${jobId}`]: false }));
    }
  }

  async function handleMarkAsDone(jobId) {
    setActionLoading(prev => ({ ...prev, [`complete-${jobId}`]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${jobId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to mark project as complete');
      alert('Project marked as complete. Awaiting client approval.');
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to mark project as complete');
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete-${jobId}`]: false }));
    }
  }

  async function handleApproveProject(jobId) {
    setActionLoading(prev => ({ ...prev, [`approve-${jobId}`]: true }));
    try {
      if (!contractCtx) throw new Error('Contract not ready');
      const job = getOngoingJobsClient().find(j => j._id === jobId);
      if (!job) throw new Error('Job not found');
      const amount = ethers.BigNumber.from(job.budget.toString());
      await contractCtx.releasePayment(jobId, { value: amount });
      const res = await fetch(`${BACKEND_URL}/api/submissions/${jobId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ feedback: 'Project approved by client' })
      });
      if (!res.ok) throw new Error('Failed to approve project in backend');
      alert('Project approved! Payment released to freelancer.');
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to approve project');
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve-${jobId}`]: false }));
    }
  }

  async function handleRaiseDispute(jobId) {
    const title = prompt('Enter dispute title:');
    const description = prompt('Enter dispute description:');
    const disputeType = 'quality_issue';

    if (!title || !description) return;

    setActionLoading(prev => ({ ...prev, [`dispute-${jobId}`]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/disputes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId, title, description, disputeType })
      });

      if (!res.ok) throw new Error('Failed to create dispute');
      alert('Dispute created successfully. It will be reviewed.');
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to create dispute');
    } finally {
      setActionLoading(prev => ({ ...prev, [`dispute-${jobId}`]: false }));
    }
  }

  function getApplicationsReceived() {
    if (!dashboardData?.applicationsReceived) return [];
    return dashboardData.applicationsReceived.filter(app => app.job);
  }

  function getApplicationsSent() {
    return dashboardData?.applications || [];
  }

  function getJobsPosted() {
    return dashboardData?.jobsPosted || [];
  }

  function getJobsAssigned() {
    return dashboardData?.jobsAssigned || [];
  }

  function getCompletedJobsClient() {
    return getJobsPosted().filter(job => job.status === 'completed');
  }

  function getCompletedJobsFreelancer() {
    return getJobsAssigned().filter(job => job.status === 'completed');
  }

  function getOngoingJobsClient() {
    return getJobsPosted().filter(job => ['assigned', 'in_progress', 'submitted'].includes(job.status));
  }

  function getOngoingJobsFreelancer() {
    return getJobsAssigned().filter(job => ['assigned', 'in_progress'].includes(job.status));
  }

  function getHiredFreelancers() {
    return getJobsPosted().filter(job => job.freelancer);
  }

  function getTotalSpent() {
    return getJobsPosted().reduce((sum, job) => sum + (job.budget || 0), 0);
  }

  function getTotalEarned() {
    return getJobsAssigned().reduce((sum, job) => sum + (job.budget || 0), 0);
  }

  function getAverageRating() {
    return 4.9;
  }

  if (authLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center">
          <span className="text-lg text-muted-foreground">Loading dashboard...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-12 px-12 lg:px-28 relative overflow-hidden w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-success/18 via-background to-accent/18" />
            <div className="absolute top-1/2 left-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] -translate-y-1/2" />
            <div className="absolute top-1/2 right-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
            <div className="container mx-auto relative z-10">
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  Welcome to Your <span className="text-gradient-green">Web3 Dashboard</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Connect your wallet to access your personalized dashboard and manage your freelance activities.
                </p>
                <div className="card-floating p-8 bg-white/80 shadow-lg rounded-2xl">
                  <h2 className="text-2xl font-bold mb-4">What you can do:</h2>
                  <ul className="text-left space-y-4 mb-6">
                    <li className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-success" />
                      <span>Track your ongoing projects and milestones</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-success" />
                      <span>Manage payments and view earnings</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-success" />
                      <span>Connect with clients and freelancers</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-success" />
                      <span>View your reputation and reviews</span>
                    </li>
                  </ul>
                  <p className="text-muted-foreground text-sm mb-6">
                    Click the "Connect Wallet" button in the header to get started
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-12 px-12 lg:px-28 relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-success/18 via-background to-accent/18" />
          <div className="absolute top-1/2 left-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] -translate-y-1/2" />
          <div className="absolute top-1/2 right-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, <span className="text-gradient-green">{user.username || user.walletAddress?.slice(0, 8) + '...'}</span>
                </h1>
                <p className="text-xl text-muted-foreground">Here's your Web3 freelance overview</p>
              </div>
              <div className="card-floating p-1">
                <div className="flex bg-secondary/50 rounded-lg">
                  <button
                    onClick={() => setUserType('freelancer')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      userType === 'freelancer' 
                        ? 'bg-success text-success-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Freelancer View
                  </button>
                  <button
                    onClick={() => setUserType('client')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      userType === 'client' 
                        ? 'bg-accent text-accent-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Client View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {userType === 'freelancer' ? (
          <>
            <section className="py-8 px-12 lg:px-28 relative overflow-hidden w-full">
              <div className="absolute top-1/2 left-[-8rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-[-8rem] w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Briefcase className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">This Month</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">{getApplicationsSent().length}</div>
                    <div className="text-sm text-muted-foreground">Jobs Applied</div>
                  </div>
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">{getOngoingJobsFreelancer().length}</div>
                    <div className="text-sm text-muted-foreground">Ongoing Projects</div>
                  </div>
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">${getTotalEarned().toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Earned</div>
                  </div>
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Star className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Average</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">{getAverageRating()}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                </div>
              </div>
            </section>
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Recent Applications</h2>
                <div className="space-y-4">
                  {getApplicationsSent().length > 0 ? (
                    getApplicationsSent().map((app) => (
                      <div key={app._id} className="card-floating p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{app.job?.title || 'Job'}</h3>
                            <p className="text-muted-foreground mb-2">Client: {app.job?.client?.username || app.job?.client?.walletAddress?.slice(0, 8) + '...'}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Budget: {app.job?.budget ? `$${app.job.budget}` : '-'}</span>
                              <span>Status: {app.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              app.status === 'pending' ? 'bg-accent/10 text-accent' :
                              app.status === 'accepted' ? 'bg-success/10 text-success' :
                              app.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                              'bg-muted'
                            }`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card-floating p-6 text-center">
                      <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
                      <p className="text-muted-foreground">You haven't applied to any jobs yet. Browse available projects and submit your first proposal.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Ongoing Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {getOngoingJobsFreelancer().length > 0 ? (
                    getOngoingJobsFreelancer().map((job) => (
                      <div key={job._id} className="card-floating p-6">
                        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        <p className="text-muted-foreground mb-4">Client: {job.client?.username || job.client?.walletAddress?.slice(0, 8) + '...'}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress || 'N/A'}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-success h-2 rounded-full transition-all"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Due: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="font-semibold text-gradient-green">${job.budget}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(e, job._id)}
                            className="hidden"
                            id={`upload-${job._id}`}
                            disabled={actionLoading[`upload-${job._id}`]}
                          />
                          <label 
                            htmlFor={`upload-${job._id}`} 
                            className={`bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors font-medium cursor-pointer ${
                              actionLoading[`upload-${job._id}`] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[`upload-${job._id}`] ? 'Uploading...' : 'Upload Files to IPFS'}
                          </label>
                          <button 
                            onClick={() => handleMarkAsDone(job._id)}
                            disabled={
                              actionLoading[`complete-${job._id}`] ||
                              !uploadedFiles[job._id]
                            }
                            className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md ml-2 transition-colors font-medium ${
                              actionLoading[`complete-${job._id}`] || !uploadedFiles[job._id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[`complete-${job._id}`] ? 'Marking...' : 'Mark as Done'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card-floating p-6 text-center col-span-2">
                      <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Ongoing Projects</h3>
                      <p className="text-muted-foreground">You don't have any active projects at the moment. Check back after your applications are accepted.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-[-6rem] w-[14rem] h-[14rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/3 left-1/3 w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.12)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Completed Projects</h2>
                <div className="space-y-4">
                  {getCompletedJobsFreelancer().length > 0 ? (
                    getCompletedJobsFreelancer().map((job) => (
                      <div key={job._id} className="card-floating p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                            <p className="text-muted-foreground mb-2">Client: {job.client?.username || job.client?.walletAddress?.slice(0, 8) + '...'}</p>
                            <p className="text-sm text-muted-foreground">Completed: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gradient-green mb-2">${job.budget}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < getAverageRating() ? 'text-accent fill-current' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card-floating p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Completed Projects</h3>
                      <p className="text-muted-foreground">You haven't completed any projects yet. Your finished work will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-[-8rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-[-8rem] w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">{getHiredFreelancers().length}</div>
                    <div className="text-sm text-muted-foreground">Hired Freelancers</div>
                  </div>
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Briefcase className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">{getOngoingJobsClient().length}</div>
                    <div className="text-sm text-muted-foreground">Projects Running</div>
                  </div>
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">${getTotalSpent().toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Invested</div>
                  </div>
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Success</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">94%</div>
                    <div className="text-sm text-muted-foreground">Project Rate</div>
                  </div>
                </div>
              </div>
            </section>
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Proposals Received</h2>
                <div className="space-y-4">
                  {getApplicationsReceived().length === 0 && <div className="text-muted-foreground">No proposals yet.</div>}
                  {getApplicationsReceived().map((app) => (
                    <div key={app._id} className="card-floating p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{app.job?.title || 'Job'}</h3>
                          <p className="text-muted-foreground mb-2">Freelancer: {app.freelancer?.username || app.freelancer?.walletAddress?.slice(0, 8) + '...'}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Proposal: {app.proposal}</span>
                            <span>Fee: {app.fee ? `$${app.fee}` : '-'}</span>
                            <span>Status: {app.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {app.status === 'pending' && (
                            <>
                              <button
                                className="px-4 py-2 bg-success text-white rounded-lg font-medium disabled:opacity-50"
                                disabled={actionLoading[app._id]}
                                onClick={() => handleApplicationAction(app._id, 'accepted')}
                              >
                                {actionLoading[app._id] ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                className="px-4 py-2 bg-destructive text-white rounded-lg font-medium disabled:opacity-50"
                                disabled={actionLoading[app._id]}
                                onClick={() => handleApplicationAction(app._id, 'rejected')}
                              >
                                {actionLoading[app._id] ? 'Rejecting...' : 'Reject'}
                              </button>
                            </>
                          )}
                          {app.status !== 'pending' && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              app.status === 'accepted' ? 'bg-success/10 text-success' :
                              app.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                              'bg-muted'
                            }`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Recent Hires</h2>
                <div className="space-y-4">
                  {getHiredFreelancers().length > 0 ? (
                    getHiredFreelancers().map((job) => (
                      <div key={job._id} className="card-floating p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{job.freelancer?.username || job.freelancer?.walletAddress?.slice(0, 8) + '...'}</h3>
                            <p className="text-muted-foreground mb-2">Project: {job.title}</p>
                            <p className="text-sm text-muted-foreground">Started: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gradient-green mb-1">${job.budget}</div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                job.status === 'in_progress' ? 'bg-accent/10 text-accent' :
                                job.status === 'completed' ? 'bg-success/10 text-success' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card-floating p-6 text-center">
                      <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Recent Hires</h3>
                      <p className="text-muted-foreground">You haven't hired any freelancers yet. Accept proposals to start working with talented professionals.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/3 left-1/3 w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.12)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Active Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {getOngoingJobsClient().length > 0 ? (
                    getOngoingJobsClient().map((job) => (
                      <div key={job._id} className="card-floating p-6">
                        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        <p className="text-muted-foreground mb-4">Freelancer: {job.freelancer?.username || job.freelancer?.walletAddress?.slice(0, 8) + '...'}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress || 'N/A'}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-success h-2 rounded-full transition-all"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Due: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="font-semibold text-gradient-green">${job.budget}</span>
                          </div>
                        </div>
                        {jobSubmissions[job._id]?.files?.length > 0 && (
                          <div className="mb-2">
                            <span className="font-semibold">Files from Freelancer:</span>
                            <ul className="list-disc ml-6">
                              {jobSubmissions[job._id]?.files?.map(file => (
                                <li key={file.cid}>
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {file.name}
                                  </a>
                                  {file.fileSize && (
                                    <span className="ml-2 text-xs text-muted-foreground">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-4">
                          <button 
                            onClick={() => handleApproveProject(job._id)}
                            disabled={
                              actionLoading[`approve-${job._id}`] ||
                              !jobSubmissions[job._id] ||
                              !jobSubmissions[job._id].files ||
                              jobSubmissions[job._id].files.length === 0
                            }
                            className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors font-medium ${
                              actionLoading[`approve-${job._id}`] || !jobSubmissions[job._id] || !jobSubmissions[job._id].files || jobSubmissions[job._id].files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[`approve-${job._id}`] ? 'Approving...' : 'Approve Project'}
                          </button>
                          <button 
                            onClick={() => router.push(`/disputes?jobId=${job._id}`)}
                            disabled={
                              actionLoading[`dispute-${job._id}`] ||
                              !jobSubmissions[job._id] ||
                              !jobSubmissions[job._id].files ||
                              jobSubmissions[job._id].files.length === 0
                            }
                            className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md ml-2 transition-colors font-medium ${
                              actionLoading[`dispute-${job._id}`] || !jobSubmissions[job._id] || !jobSubmissions[job._id].files || jobSubmissions[job._id].files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {actionLoading[`dispute-${job._id}`] ? 'Creating Dispute...' : 'Raise a Dispute'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card-floating p-6 text-center col-span-2">
                      <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Active Projects</h3>
                      <p className="text-muted-foreground">You don't have any active projects at the moment. Hire freelancers to start new projects.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-[-6rem] w-[14rem] h-[14rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/3 left-1/3 w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.12)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Completed Projects</h2>
                <div className="space-y-4">
                  {getCompletedJobsClient().length > 0 ? (
                    getCompletedJobsClient().map((job) => (
                      <div key={job._id} className="card-floating p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                            <p className="text-muted-foreground mb-2">Freelancer: {job.freelancer?.username || job.freelancer?.walletAddress?.slice(0, 8) + '...'}</p>
                            <p className="text-sm text-muted-foreground">Completed: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gradient-green mb-2">${job.budget}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < getAverageRating() ? 'text-accent fill-current' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card-floating p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Completed Projects</h3>
                      <p className="text-muted-foreground">You haven't completed any projects yet. Your finished projects will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;