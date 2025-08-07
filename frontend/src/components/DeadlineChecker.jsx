import React, { useState, useEffect } from 'react';
import JobAsCrewOneContext from '@/context/Rcontext';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS_HERE';

const DeadlineChecker = () => {
  const [jobId, setJobId] = useState('');
  const [jobInfo, setJobInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobCounter, setJobCounter] = useState(null);
  const [contract, setContract] = useState(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const checkDeadline = async () => {
      if (!jobId || !contract) return;

      try {
        const job = await contract.getJob(jobId);
        const deadline = Number(job.deadline);
        
        if (deadline > 0) {
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = deadline - now;
          
          if (timeLeft <= 0) {
            setDeadlinePassed(true);
          } else {
            setDeadlinePassed(false);
            setTimeLeft(timeLeft);
          }
        }
      } catch (error) {
        // Handle error silently
      }
    };

    checkDeadline();
    const interval = setInterval(checkDeadline, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [jobId, contract]);

  const checkDeadline = async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError('');
    setJobInfo(null);

    try {
      const contract = await JobAsCrewOneContext.createAsync(CONTRACT_ADDRESS, window.ethereum);
      
      // Use the fixed getJob method
      const job = await contract.getJob(parseInt(jobId));
      
      if (!job) {
        throw new Error('Job not found or invalid job ID');
      }
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTimestamp = parseInt(job.deadline);
      const timeRemaining = deadlineTimestamp - currentTimestamp;
      
      setJobInfo({
        title: job.title || 'N/A',
        deadline: job.deadline.toString(),
        deadlineDate: new Date(deadlineTimestamp * 1000).toISOString(),
        currentTimestamp,
        deadlineTimestamp,
        timeRemaining,
        expired: timeRemaining <= 0,
        status: job.status || 'Unknown',
        client: job.client || 'N/A',
        freelancer: job.freelancer || 'N/A',
        totalAmount: job.totalAmount || '0',
        paidAmount: job.paidAmount || '0'
      });
    } catch (err) {
      setError(`${err.message || 'Failed to check deadline'}`);
    } finally {
      setLoading(false);
    }
  };

  const getJobCounter = async () => {
    try {
      const contract = await JobAsCrewOneContext.createAsync(CONTRACT_ADDRESS, window.ethereum);
      const counter = await contract.getJobCounter();
      setJobCounter(counter);
      // Auto-fill the most recent job ID
      if (counter > 0) {
        setJobId((counter - 1).toString());
      }
    } catch (err) {
      setError('Failed to get job counter');
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg mb-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Debug: Check Job Deadline</h3>
      
      <div className="flex gap-2 mb-3 items-center">
        <button
          onClick={getJobCounter}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Get Latest Job
        </button>
        {jobCounter !== null && (
          <span className="text-sm text-gray-600">
            Total jobs: {jobCounter} (Latest ID: {jobCounter > 0 ? jobCounter - 1 : 'None'})
          </span>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          placeholder="Job ID"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="border rounded px-2 py-1"
          min="0"
        />
        <button
          onClick={checkDeadline}
          disabled={loading || !jobId}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Checking...' : 'Check Deadline'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-3">
          Error: {error}
        </div>
      )}

      {jobInfo && (
        <div className="bg-white p-3 rounded border text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Title:</strong> {jobInfo.title}</div>
            <div><strong>Status:</strong> {jobInfo.status}</div>
            <div><strong>Current Time:</strong> {new Date().toISOString()}</div>
            <div><strong>Deadline:</strong> {jobInfo.deadlineDate}</div>
            <div><strong>Current Timestamp:</strong> {jobInfo.currentTimestamp}</div>
            <div><strong>Deadline Timestamp:</strong> {jobInfo.deadlineTimestamp}</div>
            <div><strong>Time Remaining (seconds):</strong> {jobInfo.timeRemaining}</div>
            <div><strong>Status:</strong> 
              <span className={jobInfo.expired ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                {jobInfo.expired ? 'EXPIRED' : 'ACTIVE'}
              </span>
            </div>
          </div>
          
          {jobInfo.expired && (
            <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700">
              <strong>⚠️ This job's deadline has passed!</strong> 
              <br />The deadline was {Math.abs(jobInfo.timeRemaining)} seconds ago.
            </div>
          )}
          
          {!jobInfo.expired && jobInfo.timeRemaining < 3600 && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-700">
              <strong>⚠️ Warning:</strong> This job expires in less than 1 hour!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeadlineChecker;
