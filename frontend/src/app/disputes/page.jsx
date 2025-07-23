"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWalletAuth } from "@/components/WalletAuthProvider";
import {
  AlertTriangle,
  FileText,
  Clock,
  User,
  MessageSquare,
  Upload,
  Download
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const DisputePage = () => {
  const { user, token, loading: authLoading } = useWalletAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newDispute, setNewDispute] = useState({
    title: '',
    description: '',
    disputeType: 'quality_issue'
  });

  const disputeTypes = [
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'deadline_missed', label: 'Deadline Missed' },
    { value: 'scope_change', label: 'Scope Change' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'communication_issue', label: 'Communication Issue' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (user && token) {
      fetchDisputes();
    }
  }, [user, token]);

  useEffect(() => {
    if (jobId && user && token) {
      setCreateMode(true);
    }
  }, [jobId, user, token]);

  async function fetchDisputes() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/disputes/user/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createDispute() {
    if (!newDispute.title || !newDispute.description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/disputes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: jobId,
          ...newDispute
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert('Dispute created successfully');
        setCreateMode(false);
        setNewDispute({ title: '', description: '', disputeType: 'quality_issue' });
        fetchDisputes();
        if (!jobId) {
          router.push('/dashboard');
        }
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to create dispute');
      }
    } catch (error) {
      alert('Failed to create dispute');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event, disputeId) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch(`${BACKEND_URL}/api/disputes/${disputeId}/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        alert('Evidence uploaded successfully');
        fetchDisputes();
      } else {
        alert('Failed to upload evidence');
      }
    } catch (error) {
      alert('Failed to upload evidence');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'resolved_client': return 'bg-green-100 text-green-800';
      case 'resolved_freelancer': return 'bg-green-100 text-green-800';
      case 'resolved_admin': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center">
          <span className="text-lg text-muted-foreground">Loading...</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center">
          <span className="text-lg text-muted-foreground">Please connect your wallet to access disputes.</span>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Header */}
        <section className="py-12 px-12 lg:px-28 relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-background to-orange-500/10" />
          <div className="absolute top-1/2 left-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(239,68,68,0.15)_0%,_transparent_70%)] -translate-y-1/2" />
          <div className="absolute top-1/2 right-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.12)_0%,_transparent_70%)] -translate-y-1/2" />
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  <AlertTriangle className="w-10 h-10 inline mr-3 text-red-500" />
                  Dispute Management
                </h1>
                <p className="text-xl text-muted-foreground">
                  {createMode ? 'Create a new dispute for your project' : 'Manage and track your project disputes'}
                </p>
              </div>
              {!createMode && (
                <button
                  onClick={() => setCreateMode(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create New Dispute
                </button>
              )}
            </div>
          </div>
        </section>

        {createMode ? (
          /* Create Dispute Form */
          <section className="py-8 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="card-floating p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Create New Dispute</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Dispute Title</label>
                    <input
                      type="text"
                      value={newDispute.title}
                      onChange={(e) => setNewDispute(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Dispute Type</label>
                    <select
                      value={newDispute.disputeType}
                      onChange={(e) => setNewDispute(prev => ({ ...prev, disputeType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      {disputeTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Detailed Description</label>
                    <textarea
                      value={newDispute.description}
                      onChange={(e) => setNewDispute(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Provide detailed information about the dispute..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={createDispute}
                      disabled={loading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Dispute'}
                    </button>
                    <button
                      onClick={() => {
                        setCreateMode(false);
                        if (!jobId) {
                          router.push('/dashboard');
                        }
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Disputes List */
          <section className="py-8 px-12 lg:px-28">
            <div className="container mx-auto">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg text-muted-foreground">Loading disputes...</div>
                </div>
              ) : disputes.length === 0 ? (
                <div className="card-floating p-12 text-center">
                  <AlertTriangle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Disputes Found</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any active disputes. We hope your projects continue to run smoothly!
                  </p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {disputes.map((dispute) => (
                    <div key={dispute._id} className="card-floating p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{dispute.title}</h3>
                          <p className="text-muted-foreground mb-4">{dispute.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span>
                              <FileText className="w-4 h-4 inline mr-1" />
                              Project: {dispute.job?.title}
                            </span>
                            <span>
                              <User className="w-4 h-4 inline mr-1" />
                              Type: {disputeTypes.find(t => t.value === dispute.disputeType)?.label}
                            </span>
                            <span>
                              <Clock className="w-4 h-4 inline mr-1" />
                              Created: {new Date(dispute.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Evidence Section */}
                      {dispute.evidence && dispute.evidence.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Evidence Files:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {dispute.evidence.map((file, index) => (
                              <div key={index} className="bg-gray-100 p-2 rounded text-xs">
                                <Download className="w-4 h-4 inline mr-1" />
                                {file.filename}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-4 pt-4">
                        {dispute.status === 'open' && (
                          <>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleFileUpload(e, dispute._id)}
                              className="hidden"
                              id={`evidence-${dispute._id}`}
                            />
                            <label
                              htmlFor={`evidence-${dispute._id}`}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer text-sm"
                            >
                              <Upload className="w-4 h-4 inline mr-1" />
                              Upload Evidence
                            </label>
                          </>
                        )}
                        
                        <button
                          onClick={() => setSelectedDispute(dispute)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DisputePage;
