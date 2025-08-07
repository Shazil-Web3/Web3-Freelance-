"use client";

import { useEffect, useState } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWalletAuth } from './WalletAuthProvider';

export function SignerProvider({ children, requireAuth = false }) {
  const { isConnected, signer, account } = useWalletConnection();
  const { user, token, loading } = useWalletAuth();
  const [signerReady, setSignerReady] = useState(false);

  useEffect(() => {
    // Check if signer is available
    if (isConnected && signer && account) {
      setSignerReady(true);
    } else {
      setSignerReady(false);
    }
  }, [isConnected, signer, account]);

  // If signer is required but not ready, show loading
  if (requireAuth && !signerReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {!isConnected ? 'Please connect your wallet' : 'Preparing wallet connection...'}
          </p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !loading && (!user || !token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Please authenticate your wallet to continue
          </p>
        </div>
      </div>
    );
  }

  return children;
} 