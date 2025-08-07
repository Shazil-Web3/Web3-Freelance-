"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWalletAuth } from "@/components/WalletAuthProvider";
import { useContract } from "@/context/ContractContext";
import { WalletConnectionChecker } from "@/components/WalletConnectionChecker";
import {
  AlertTriangle,
  FileText,
  Clock,
  User,
  MessageSquare,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Shield,
  Gavel,
  Eye,
  EyeOff,
  Loader2,
  Crown
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const DisputePage = () => {
  const { user, token, loading: authLoading } = useWalletAuth();
  const { contract, address } = useContract();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [isDisputeResolver, setIsDisputeResolver] = useState(false);
  const [resolverLoading, setResolverLoading] = useState(false);
  const [isContractOwner, setIsContractOwner] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [newResolverAddress, setNewResolverAddress] = useState('');
  const [resolverStatus, setResolverStatus] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [jobDetails, setJobDetails] = useState(null);
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
      checkDisputeResolverStatus();
      fetchDisputes();
    }
  }, [user, token]);

  useEffect(() => {
    if (jobId && user && token) {
      // If there's a jobId parameter, show create form for that specific job
      // BUT if user is a dispute resolver, show disputes list instead
      if (!isDisputeResolver) {
        setCreateMode(true);
        fetchJobDetails(jobId);
      } else {
        // For dispute resolvers, show the disputes list even with jobId
        setCreateMode(false);
      }
    }
  }, [jobId, user, token, isDisputeResolver]);

  // Refetch disputes when dispute resolver status changes
  useEffect(() => {
    if (user && token && !resolverLoading) {
      fetchDisputes();
    }
  }, [isDisputeResolver, resolverLoading]);

  // Check contract owner and resolver status on mount
  useEffect(() => {
    if (user && contract) {
      checkContractOwnerStatus();
      checkCurrentUserResolverStatus();
    }
  }, [user, contract]);

  // Additional effect to check resolver status when contract becomes available
  useEffect(() => {
    if (user && contract && user.walletAddress) {
      checkCurrentUserResolverStatus();
    }
  }, [contract, user?.walletAddress]);

  // Reset createMode when user becomes a dispute resolver
  useEffect(() => {
    if (isDisputeResolver && createMode) {
      setCreateMode(false);
    }
  }, [isDisputeResolver, createMode]);

  // Auto-refresh disputes when component mounts or resolver status changes
  useEffect(() => {
    if (token && isDisputeResolver) {
      fetchDisputes();
    }
  }, [token, isDisputeResolver]);

  // Check dispute resolver status on mount
  useEffect(() => {
    if (token) {
      checkDisputeResolverStatus();
    }
  }, [token]);

  // Periodic check for resolved disputes
  useEffect(() => {
    if (isDisputeResolver && token) {
      const interval = setInterval(() => {
        checkResolvedDisputes();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isDisputeResolver, token]);

  async function checkDisputeResolverStatus() {
    if (!user?.walletAddress) return;
    
    setResolverLoading(true);
    try {
      // First check from smart contract directly
      if (contract) {
        const isResolver = await contract.isDisputeResolver(user.walletAddress);
        setIsDisputeResolver(isResolver);
      } else {
        // Fallback to backend API if contract not available
        const res = await fetch(`${BACKEND_URL}/api/disputes/resolver/check`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setIsDisputeResolver(data.isDisputeResolver);
        } else {
          console.error('Failed to check dispute resolver status:', res.status, res.statusText);
        }
      }
    } catch (error) {
      console.error('Failed to check dispute resolver status:', error);
    } finally {
      setResolverLoading(false);
    }
  }

  async function fetchDisputes() {
    setLoading(true);
    try {
      const endpoint = isDisputeResolver ? '/api/disputes/resolver/all' : '/api/disputes/user/all';
      
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      } else {
        console.error('Failed to fetch disputes:', res.status, res.statusText);
        const errorData = await res.text();
        console.error('Error response:', errorData);
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
        
        // Call smart contract if we have the jobId
        if (data.dispute?.job?.contractJobId !== undefined && contract) {
          try {
            await contract.raiseDispute(Number(data.dispute.job.contractJobId), newDispute.description);
            alert('Dispute created successfully and raised on blockchain!');
          } catch (contractError) {
            console.error('Smart contract call failed:', contractError);
            alert('Dispute created in database but smart contract call failed. Please contact support.');
          }
        } else {
          alert('Dispute created successfully');
        }
        
        setCreateMode(false);
        setNewDispute({ title: '', description: '', disputeType: 'quality_issue' });
        fetchDisputes();
        // If we created a dispute for a specific job, go back to dashboard
        // If we created a general dispute, stay on disputes page
        if (jobId) {
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

  async function resolveDispute(disputeId, decision) {
    setActionLoading(prev => ({ ...prev, [`resolve-${disputeId}`]: true }));
    try {
      // Check if user is a dispute resolver
      if (!isDisputeResolver) {
        alert('Only dispute resolvers can resolve disputes. Please contact the contract owner to be assigned as a dispute resolver.');
        return;
      }

      const dispute = disputes.find(d => d._id === disputeId);
      
      if (!dispute?.job?.contractJobId) {
        console.error('Dispute job data:', dispute?.job);
        console.error('Contract job ID missing for dispute:', disputeId);
        alert('Contract job ID not found for this dispute');
        return;
      }

      // First, ensure the dispute is properly raised on the blockchain
      try {
        // Check the job status in the smart contract
        const jobStatus = await contract.getJobStatus(Number(dispute.job.contractJobId));
        
        // If job is not in disputed status, try to raise the dispute
        if (jobStatus !== 3) { // 3 = Disputed status in JobStatus enum
          try {
            await contract.raiseDispute(Number(dispute.job.contractJobId), dispute.description || 'Dispute raised by resolver');
          } catch (raiseError) {
            console.error('Failed to raise dispute on blockchain:', raiseError);
            alert('Failed to raise dispute on blockchain. Please try again.');
            return;
          }
        }
      } catch (statusError) {
        console.error('Error checking job status:', statusError);
        // Continue anyway, the resolve might still work
      }

      // Call smart contract directly first
      if (contract) {
        try {
          // Map decision to smart contract enum values
          // 0 = None, 1 = ClientWon, 2 = FreelancerWon
          const contractDecision = decision === 'client_favor' ? 1 : 2;
          
          await contract.resolveDispute(Number(dispute.job.contractJobId), contractDecision);
          
          // Update backend after successful smart contract call
          let backendUpdateSuccess = false;
          let retryCount = 0;
          const maxRetries = 2; // Reduced from 3 to 2
          
          while (!backendUpdateSuccess && retryCount < maxRetries) {
            try {
              const res = await fetch(`${BACKEND_URL}/api/disputes/${disputeId}/resolve`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  decision,
                  resolutionDescription: `Dispute resolved in favor of ${decision === 'client_favor' ? 'client' : 'freelancer'}`
                })
              });

              if (res.ok) {
                backendUpdateSuccess = true;
              } else {
                console.error(`❌ Backend update failed (attempt ${retryCount + 1}):`, res.status, res.statusText);
                retryCount++;
                if (retryCount < maxRetries) {
                  // Wait 1 second before retry (reduced from 2 seconds)
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (error) {
              console.error(`❌ Backend update error (attempt ${retryCount + 1}):`, error);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (backendUpdateSuccess) {
            alert(`Dispute resolved successfully! Payment has been automatically released to the ${decision === 'client_favor' ? 'client' : 'freelancer'}. The project is now marked as completed.`);
            
            // Set flag to indicate we're returning from dispute resolution
            sessionStorage.setItem('returningFromDispute', 'true');
            
            // Immediately remove the resolved dispute from the local state
            setDisputes(prevDisputes => prevDisputes.filter(d => d._id !== disputeId));
            
            // Immediately refresh disputes list and redirect to dashboard
            await immediateRefreshDisputes();
            router.push('/dashboard');
          } else {
            // Even if backend update fails, the dispute was resolved on blockchain
            // So we should still remove it from the list and update the UI
            alert(`Dispute resolved successfully on blockchain! Payment has been automatically released to the ${decision === 'client_favor' ? 'client' : 'freelancer'}. The project is now marked as completed.`);
            
            // Set flag to indicate we're returning from dispute resolution
            sessionStorage.setItem('returningFromDispute', 'true');
            
            // Immediately remove the resolved dispute from the local state
            setDisputes(prevDisputes => prevDisputes.filter(d => d._id !== disputeId));
            
            // Try to manually update job status as fallback
            if (dispute?.job?._id) {
              await updateJobStatusAfterDispute(dispute.job._id, 'completed');
            }
            
            // Immediately refresh disputes list and redirect to dashboard
            await immediateRefreshDisputes();
            router.push('/dashboard');
          }
        } catch (contractError) {
          console.error('Smart contract call failed:', contractError);
          if (contractError.message.includes('NotResolver')) {
            alert('You are not authorized as a dispute resolver. Please contact the contract owner.');
          } else if (contractError.message.includes('NotDisputed')) {
            alert('The job is not in disputed status in the smart contract. This might happen if the dispute was not properly raised on the blockchain. Please contact support.');
          } else {
            alert('Failed to resolve dispute on blockchain: ' + contractError.message);
          }
        }
      } else {
        alert('Smart contract not available');
      }
    } catch (error) {
      console.error('Resolve dispute error:', error);
      alert('Failed to resolve dispute');
    } finally {
      setActionLoading(prev => ({ ...prev, [`resolve-${disputeId}`]: false }));
    }
  }

  async function cancelProject(disputeId) {
    setActionLoading(prev => ({ ...prev, [`cancel-${disputeId}`]: true }));
    try {
      // Find the dispute to get the contract job ID
      const dispute = disputes.find(d => d._id === disputeId);
      
      if (!dispute?.job?.contractJobId) {
        console.error('Dispute job data:', dispute?.job);
        console.error('Contract job ID missing for dispute:', disputeId);
        alert('Contract job ID not found for this dispute');
        return;
      }

      // Call smart contract directly
      if (contract) {
        try {
          await contract.cancelProject(Number(dispute.job.contractJobId));
          
          // Update backend after successful smart contract call
          const res = await fetch(`${BACKEND_URL}/api/disputes/${disputeId}/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              cancellationReason: 'Project cancelled by dispute resolver'
            })
          });

          if (res.ok) {
            alert('Project cancelled successfully on blockchain!');
            fetchDisputes();
          } else {
            alert('Project cancelled on blockchain but backend update failed');
          }
        } catch (contractError) {
          console.error('Smart contract call failed:', contractError);
          alert('Failed to cancel project on blockchain: ' + contractError.message);
        }
      } else {
        alert('Smart contract not available');
      }
    } catch (error) {
      console.error('Cancel project error:', error);
      alert('Failed to cancel project');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${disputeId}`]: false }));
    }
  }

  // Handle post-dispute payment release for freelancer-won disputes
  async function handlePostDisputePayment(disputeId) {
    setActionLoading(prev => ({ ...prev, [`payment-${disputeId}`]: true }));
    try {
      const dispute = disputes.find(d => d._id === disputeId);
      if (!dispute) {
        alert('Dispute not found');
        return;
      }

      // Check if dispute was resolved in favor of freelancer
      if (dispute.resolution?.type !== 'freelancer_favor') {
        alert('This dispute was not resolved in favor of the freelancer');
        return;
      }

      // Check if user is the client
      if (dispute.client?._id !== user._id) {
        alert('Only the client can release payment after dispute resolution');
        return;
      }

      // Check job status in smart contract
      const jobStatus = await checkJobStatusInContract(Number(dispute.job.contractJobId));

      if (jobStatus && jobStatus.status === 4) { // Resolved status
        // The dispute was resolved in favor of freelancer, so payment should be released
        // Since the smart contract already handled the payment during dispute resolution,
        // we just need to update the backend to reflect this
        alert('Payment was already released to the freelancer during dispute resolution. The dispute has been resolved in favor of the freelancer.');
      } else {
        alert('Job status is not in resolved state. Please contact support.');
      }

    } catch (error) {
      console.error('Post-dispute payment error:', error);
      alert('Failed to handle post-dispute payment: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`payment-${disputeId}`]: false }));
    }
  }

  // Manual job status update after dispute resolution
  async function updateJobStatusAfterDispute(jobId, newStatus = 'completed') {
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        return true;
      } else {
        console.error('❌ Failed to update job status:', res.status, res.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating job status:', error);
      return false;
    }
  }

  // Check if user is contract owner
  async function checkContractOwnerStatus() {
    if (!user?.walletAddress || !contract) return;
    
    setOwnerLoading(true);
    try {
      const owner = await contract.getOwner();
      setIsContractOwner(owner.toLowerCase() === user.walletAddress.toLowerCase());
    } catch (error) {
      console.error('Failed to check contract owner status:', error);
    } finally {
      setOwnerLoading(false);
    }
  }

  // Add/remove dispute resolver (only for contract owner)
  async function manageDisputeResolver(address, status) {
    if (!contract || !isContractOwner) {
      alert('Only contract owner can manage dispute resolvers');
      return;
    }

    if (!address) {
      alert('Please enter a valid wallet address');
      return;
    }

    try {
      await contract.assignDisputeResolver(address, status);
      alert(`Dispute resolver ${status ? 'added' : 'removed'} successfully!`);
      setNewResolverAddress('');
      setResolverStatus('');
      
      // Refresh current user's resolver status in case they were added/removed
      await checkCurrentUserResolverStatus();
    } catch (error) {
      console.error('Failed to manage dispute resolver:', error);
      alert('Failed to manage dispute resolver: ' + error.message);
    }
  }

  // Check current user's resolver status
  async function checkCurrentUserResolverStatus() {
    if (!user?.walletAddress || !contract) return;
    
    try {
      const isResolver = await contract.isDisputeResolver(user.walletAddress);
      setIsDisputeResolver(isResolver);
    } catch (error) {
      console.error('Failed to check current user resolver status:', error);
    }
  }

  // Fetch job details for dispute creation
  async function fetchJobDetails(jobId) {
    if (!jobId || !token) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setJobDetails(data.job);
      } else {
        console.error('Failed to fetch job details:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    }
  }

  // Debug function to check if a specific dispute exists
  async function checkDisputeExists(disputeId) {
    if (!token) return;
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/disputes/${disputeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.dispute;
      } else {
        console.error('Dispute not found:', res.status, res.statusText);
        return null;
      }
    } catch (error) {
      console.error('Failed to check dispute:', error);
      return null;
    }
  }

  // Check job status in smart contract
  async function checkJobStatusInContract(jobId) {
    if (!contract) return null;
    
    try {
      const job = await contract.getJob(jobId);
      return job;
    } catch (error) {
      console.error('Failed to get job status from contract:', error);
      return null;
    }
  }

  // Raise dispute on smart contract if not already raised
  async function ensureDisputeRaisedOnContract(dispute) {
    if (!contract || !dispute?.job?.contractJobId) return false;
    
    try {
      // Check current job status
      const jobStatus = await checkJobStatusInContract(Number(dispute.job.contractJobId));
      
      // If job is not in Disputed status, try to raise the dispute
      if (jobStatus && jobStatus.status !== 3) { // 3 = Disputed status
        
        // Check if user is authorized (client or freelancer)
        const isClient = jobStatus.client.toLowerCase() === user.walletAddress.toLowerCase();
        const isFreelancer = jobStatus.freelancer.toLowerCase() === user.walletAddress.toLowerCase();
        
        if (!isClient && !isFreelancer) {
          console.error('User is not authorized to raise dispute for this job');
          return false;
        }
        
        // Raise the dispute
        await contract.raiseDispute(Number(dispute.job.contractJobId), dispute.description);
        return true;
      }
      
      return true; // Already in disputed status
    } catch (error) {
      console.error('Failed to raise dispute on contract:', error);
      return false;
    }
  }

  // Check and sync job status between blockchain and backend
  async function checkJobStatusSync(jobId) {
    if (!contract || !jobId) return null;
    
    try {
      // Check blockchain status
      const blockchainStatus = await checkJobStatusInContract(Number(jobId));
      
      // Check backend status
      const backendRes = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        
        // Compare statuses
        const statusMatch = blockchainStatus && 
          ((blockchainStatus.status === 0 && backendData.job.status === 'open') ||
           (blockchainStatus.status === 1 && backendData.job.status === 'in_progress') ||
           (blockchainStatus.status === 2 && backendData.job.status === 'completed') ||
           (blockchainStatus.status === 3 && backendData.job.status === 'disputed') ||
           (blockchainStatus.status === 4 && backendData.job.status === 'resolved'));
        
        return {
          blockchain: blockchainStatus,
          backend: backendData.job,
          match: statusMatch
        };
      }
      
      return { blockchain: blockchainStatus, backend: null, match: false };
    } catch (error) {
      console.error('Failed to check job status sync:', error);
      return null;
    }
  }

  // Force refresh dashboard data
  async function refreshDashboardData() {
    try {
      // This would trigger a dashboard refresh if we were on the dashboard page
      // For now, we'll just redirect to dashboard which will trigger a fresh load
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  }

  // Check for resolved disputes and clean up
  async function checkResolvedDisputes() {
    try {
      // Get all disputes including resolved ones
      const res = await fetch(`${BACKEND_URL}/api/disputes/resolver/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const resolvedDisputes = data.disputes?.filter(d => 
          d.status === 'resolved_client' || d.status === 'resolved_freelancer'
        ) || [];
        
        if (resolvedDisputes.length > 0) {
          setDisputes(prevDisputes => 
            prevDisputes.filter(d => 
              !resolvedDisputes.some(resolved => resolved._id === d._id)
            )
          );
        }
      }
    } catch (error) {
      console.error('❌ Error checking resolved disputes:', error);
    }
  }

  // Force refresh disputes list and check for resolved disputes
  async function forceRefreshDisputes() {
    console.log('🔄 Force refreshing disputes list...');
    setLoading(true);
    try {
      await fetchDisputes();
      console.log('✅ Disputes list refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh disputes list:', error);
    } finally {
      setLoading(false);
    }
  }

  // Immediate refresh disputes list
  const immediateRefreshDisputes = async () => {
    try {
      const endpoint = isDisputeResolver ? '/api/disputes/resolver/all' : '/api/disputes/user/all';
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('❌ Failed to refresh disputes list:', error);
    }
  };

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

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'OPEN';
      case 'under_review': return 'UNDER REVIEW';
      case 'resolved_client': return 'RESOLVED (CLIENT)';
      case 'resolved_freelancer': return 'RESOLVED (FREELANCER)';
      case 'resolved_admin': return 'RESOLVED (ADMIN)';
      case 'closed': return 'CLOSED';
      default: return status.toUpperCase();
    }
  };

  if (authLoading || resolverLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg text-muted-foreground">Loading...</span>
          </div>
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
    <WalletConnectionChecker requireConnection={true}>
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
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                    <h1 className="text-4xl font-bold">
                      Dispute Management
                    </h1>
                    {isDisputeResolver && (
                      <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        Dispute Resolver
                      </div>
                    )}
                  </div>
                  <p className="text-xl text-muted-foreground">
                    {isDisputeResolver 
                      ? 'Review and resolve all project disputes' 
                      : createMode 
                        ? 'Create a new dispute for your project' 
                        : 'Manage and track your project disputes'
                    }
                  </p>
                
                {/* Debug Information - Always show toggle button for dispute resolvers */}
                {isDisputeResolver && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setIsDisputeResolver(!isDisputeResolver);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs mr-2"
                    >
                      Toggle Dispute Resolver Status (Testing)
                    </button>
                    <button
                      onClick={forceRefreshDisputes}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Refresh Disputes List
                    </button>
                  </div>
                )}
              </div>
              {!createMode && !isDisputeResolver && (
                <button
                  onClick={() => setCreateMode(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create New Dispute
                </button>
              )}
              {isDisputeResolver && createMode && (
                <button
                  onClick={() => setCreateMode(false)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View All Disputes
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Dispute Resolver Management Section (for Contract Owner) */}
        {isContractOwner && (
          <section className="py-8 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="card-floating p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Contract Owner Panel
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Manage Dispute Resolvers</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newResolverAddress}
                        onChange={(e) => setNewResolverAddress(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter wallet address (0x...)"
                      />
                      <select
                        value={resolverStatus}
                        onChange={(e) => setResolverStatus(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select Action</option>
                        <option value="add">Add Resolver</option>
                        <option value="remove">Remove Resolver</option>
                      </select>
                      <button
                        onClick={() => manageDisputeResolver(newResolverAddress, resolverStatus === 'add')}
                        disabled={!newResolverAddress || !resolverStatus}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        {ownerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* User Status Information */}
        {!isDisputeResolver && !isContractOwner && (
          <section className="py-4 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Dispute Resolution Access</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      You are not authorized to resolve disputes. Only designated dispute resolvers can resolve disputes. 
                      If you need to resolve a dispute, please contact the contract owner to be assigned as a dispute resolver.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dispute Resolver Status Information */}
        {isDisputeResolver && (
          <section className="py-4 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-800">Dispute Resolver Access Granted</h3>
                    <p className="text-sm text-green-700 mt-1">
                      You are authorized as a dispute resolver. You can now review and resolve disputes between clients and freelancers.
                      Use the resolve buttons below to handle disputes and distribute funds accordingly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dispute Resolver Actions Panel */}
        {isDisputeResolver && !createMode && (
          <section className="py-4 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-800">Dispute Resolution Panel</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You have {disputes.filter(d => d.status === 'open' || d.status === 'under_review').length} actionable disputes to review.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchDisputes()}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Loader2 className="w-4 h-4 inline mr-1" />
                      Refresh Disputes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Additional Toggle Button for Create Mode */}
        {isDisputeResolver && createMode && (
          <section className="py-4 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-800">Dispute Resolver - Create Mode</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You are in create mode as a dispute resolver. You can create disputes or switch back to resolver view.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsDisputeResolver(!isDisputeResolver);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs mr-2"
                    >
                      Toggle Dispute Resolver Status (Testing)
                    </button>
                    <button
                      onClick={() => setCreateMode(false)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      View All Disputes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {createMode && !isDisputeResolver ? (
          /* Create Dispute Form */
          <section className="py-8 px-12 lg:px-28">
            <div className="container mx-auto">
              <div className="card-floating p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Create New Dispute</h2>
                
                {/* Show job information if creating dispute for specific job */}
                {jobId && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Creating Dispute for Job</h3>
                    <p className="text-sm text-blue-700">Job ID: {jobId}</p>
                    {jobDetails && (
                      <div className="mt-2">
                        <p className="text-sm text-blue-700"><strong>Title:</strong> {jobDetails.title}</p>
                        <p className="text-sm text-blue-700"><strong>Status:</strong> {jobDetails.status}</p>
                        <p className="text-sm text-blue-700"><strong>Budget:</strong> ${jobDetails.budget}</p>
                        {jobDetails.freelancer && (
                          <p className="text-sm text-blue-700"><strong>Freelancer:</strong> {jobDetails.freelancer.username}</p>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-blue-700 mt-2">
                      You are creating a dispute for a specific job. This dispute will be linked to the job and can be resolved by dispute resolvers.
                    </p>
                  </div>
                )}
                
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
                        setNewDispute({ title: '', description: '', disputeType: 'quality_issue' });
                        // If we came from a specific job, go back to dashboard
                        // If we came from disputes page, stay on disputes page
                        if (jobId) {
                          router.push('/dashboard');
                        }
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Smart Contract Integration Note */}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Smart Contract Integration:</strong> When you create this dispute, it will be automatically raised on the blockchain smart contract. 
                      This ensures the dispute is recorded on-chain and can be resolved by authorized dispute resolvers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Disputes List - Show for all users (including clients in create mode) */}
        {(!createMode || !isDisputeResolver) && (
          <section className="py-8 px-12 lg:px-28">
            <div className="container mx-auto">
              {/* Section Header for Clients */}
              {!isDisputeResolver && createMode && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">Your Existing Disputes</h2>
                  <p className="text-muted-foreground">Below are all the disputes you have created:</p>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg text-muted-foreground">Loading disputes...</span>
                  </div>
                </div>
              ) : disputes.length === 0 ? (
                <div className="card-floating p-12 text-center">
                  <AlertTriangle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Disputes Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {isDisputeResolver 
                      ? 'There are no active disputes to review at the moment.'
                      : "You don't have any active disputes. We hope your projects continue to run smoothly!"
                    }
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

                          {/* Dispute Resolver View - Show Client and Freelancer */}
                          {isDisputeResolver && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-sm text-gray-600 mb-2">Client</h4>
                                <p className="text-sm">{dispute.client?.username || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 font-mono">{dispute.client?.walletAddress}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-gray-600 mb-2">Freelancer</h4>
                                <p className="text-sm">{dispute.freelancer?.username || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 font-mono">{dispute.freelancer?.walletAddress}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dispute.status)}`}>
                          {getStatusText(dispute.status)}
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

                      {/* Resolution Details */}
                      {dispute.resolution && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2">Resolution Details</h4>
                          <p className="text-sm text-gray-700 mb-2">{dispute.resolution.description}</p>
                          <p className="text-xs text-gray-500">
                            Resolved on: {new Date(dispute.resolution.resolvedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-4 pt-4">
                        {!isDisputeResolver && dispute.status === 'open' && (
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
                        
                        {isDisputeResolver && (dispute.status === 'open' || dispute.status === 'under_review') && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const success = await ensureDisputeRaisedOnContract(dispute);
                                  if (success) {
                                    alert('Dispute raised successfully on smart contract!');
                                  } else {
                                    alert('Failed to raise dispute on smart contract. Please check if you are authorized.');
                                  }
                                } catch (error) {
                                  console.error('Error raising dispute:', error);
                                  alert('Error raising dispute: ' + error.message);
                                }
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                            >
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Raise Dispute on Contract
                            </button>
                            <button
                              onClick={() => resolveDispute(dispute._id, 'client_favor')}
                              disabled={actionLoading[`resolve-${dispute._id}`]}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                            >
                              {actionLoading[`resolve-${dispute._id}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  Resolve (Client)
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => resolveDispute(dispute._id, 'freelancer_favor')}
                              disabled={actionLoading[`resolve-${dispute._id}`]}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                            >
                              {actionLoading[`resolve-${dispute._id}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  Resolve (Freelancer)
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => cancelProject(dispute._id)}
                              disabled={actionLoading[`cancel-${dispute._id}`]}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                            >
                              {actionLoading[`cancel-${dispute._id}`] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 inline mr-1" />
                                  Cancel Project
                                </>
                              )}
                            </button>
                          </>
                        )}
                        
                        {/* Post-dispute payment release for client */}
                        {!isDisputeResolver && dispute.resolution?.type === 'freelancer_favor' && dispute.client?._id === user._id && (
                          <button
                            onClick={() => handlePostDisputePayment(dispute._id)}
                            disabled={actionLoading[`payment-${dispute._id}`]}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                          >
                            {actionLoading[`payment-${dispute._id}`] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Payment Released (Dispute Resolved)
                              </>
                            )}
                          </button>
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
    </WalletConnectionChecker>
  );
};

export default DisputePage;
