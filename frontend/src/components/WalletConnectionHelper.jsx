"use client";

import { useWalletAuth } from './WalletAuthProvider';
import { useWalletConnection } from '../hooks/useWalletConnection';

export function WalletConnectionHelper() {
  const { user, token, loading } = useWalletAuth();
  const { isConnected, isConnecting, connectWallet, forceSigningPermissionRequest } = useWalletConnection();

  // Manual trigger for signing permission request
  const handleManualSigningRequest = async () => {
    try {
      const success = await forceSigningPermissionRequest();
      if (success) {
        // Trigger re-authentication after successful signing
        window.location.reload();
      } else {
        alert('Please approve the signing request in MetaMask to continue.');
      }
    } catch (error) {
      alert('Failed to request signing permissions. Please try again.');
    }
  };

  // If wallet is connected and user is authenticated, don't show anything
  if (isConnected && user && token) {
    return null;
  }

  // If wallet is not connected, show connection prompt
  if (!isConnected && !isConnecting) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Wallet not connected
              </p>
              <p className="text-sm mt-1">
                Please connect your wallet to use this application.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If wallet is connecting, show loading
  if (isConnecting) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
            <p className="text-sm font-medium">
              Connecting wallet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If wallet is connected but user is not authenticated, show authentication prompt
  if (isConnected && !user && !loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Authentication required
              </p>
              <p className="text-sm mt-1">
                Your wallet is connected! Please approve the signing request in MetaMask to complete authentication.
              </p>
            </div>
            <div className="ml-auto pl-3 space-y-2">
              <button
                onClick={handleManualSigningRequest}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium block w-full"
              >
                Request Signing
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium block w-full"
              >
                Retry Auth
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 