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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { user, token, loading: authLoading } = useWalletAuth();
  const [userType, setUserType] = useState('freelancer');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  // DEBUG LOGGING
  if (typeof window !== 'undefined') {
    console.log('DASHBOARD DEBUG:', { user, token, authLoading }); // Fix: use authLoading instead of loading
    console.log('DASHBOARD: user=', user);
    console.log('DASHBOARD: token=', token);
    console.log('DASHBOARD: loading=', authLoading); // Fix: use authLoading instead of loading
  }

  useEffect(() => {
    if (user && user.walletAddress && token) {
      console.log('DASHBOARD: Calling fetchDashboard');
      fetchDashboard();
    }
    // eslint-disable-next-line
  }, [user, token]);

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

  // Accept or reject application
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

  // Helper: get applications received for jobs posted by this client
  function getApplicationsReceived() {
    if (!dashboardData?.applicationsReceived) return [];
    // Only applications where job is not null (i.e., belongs to this client)
    return dashboardData.applicationsReceived.filter(app => app.job);
  }

  // Helper: get applications sent by freelancer
  function getApplicationsSent() {
    return dashboardData?.applications || [];
  }

  // Helper: get jobs posted by client
  function getJobsPosted() {
    return dashboardData?.jobsPosted || [];
  }

  // Helper: get jobs assigned to freelancer
  function getJobsAssigned() {
    return dashboardData?.jobsAssigned || [];
  }

  // Helper: get completed jobs for client
  function getCompletedJobsClient() {
    return getJobsPosted().filter(job => job.status === 'completed');
  }

  // Helper: get completed jobs for freelancer
  function getCompletedJobsFreelancer() {
    return getJobsAssigned().filter(job => job.status === 'completed');
  }

  // Helper: get ongoing jobs for client
  function getOngoingJobsClient() {
    return getJobsPosted().filter(job => ['assigned', 'in_progress'].includes(job.status));
  }

  // Helper: get ongoing jobs for freelancer
  function getOngoingJobsFreelancer() {
    return getJobsAssigned().filter(job => ['assigned', 'in_progress'].includes(job.status));
  }

  // Helper: get hired freelancers for client
  function getHiredFreelancers() {
    return getJobsPosted().filter(job => job.freelancer);
  }

  // Helper: get total spent for client
  function getTotalSpent() {
    return getJobsPosted().reduce((sum, job) => sum + (job.budget || 0), 0);
  }

  // Helper: get total earned for freelancer
  function getTotalEarned() {
    return getJobsAssigned().reduce((sum, job) => sum + (job.budget || 0), 0);
  }

  // Helper: get average rating (stub, needs backend support)
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
        {/* Dashboard Header */}
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
            {/* Freelancer Stats */}
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
            {/* Applied Jobs */}
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Recent Applications</h2>
                <div className="space-y-4">
                  {getApplicationsSent().map((app) => (
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
                  ))}
                </div>
              </div>
            </section>
            {/* Ongoing Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Ongoing Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {getOngoingJobsFreelancer().map((job) => (
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
                    </div>
                  ))}
                </div>
              </div>
            </section>
            {/* Completed Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-[-6rem] w-[14rem] h-[14rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Completed Projects</h2>
                <div className="space-y-4">
                  {getCompletedJobsFreelancer().map((job) => (
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
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Client Stats */}
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
            {/* Applications Received (Proposals) */}
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
            {/* Hired Freelancers */}
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Recent Hires</h2>
                <div className="space-y-4">
                  {getHiredFreelancers().map((job) => (
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
                  ))}
                </div>
              </div>
            </section>
            {/* Client Ongoing Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Active Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {getOngoingJobsClient().map((job) => (
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
                    </div>
                  ))}
                </div>
              </div>
            </section>
            {/* Client Completed Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              <div className="absolute top-1/2 left-[-6rem] w-[14rem] h-[14rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Completed Projects</h2>
                <div className="space-y-4">
                  {getCompletedJobsClient().map((job) => (
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
                  ))}
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