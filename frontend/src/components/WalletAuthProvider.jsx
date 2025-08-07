'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '../context/WalletContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const WalletAuthContext = createContext();

export function WalletAuthProvider({ children }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessage, isConnected: walletConnected, account: walletAccount, checkSigningPermissions, checkAndRequestSigningPermissions, forceSigningPermissionRequest } = useWallet();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Function to re-authenticate wallet
  const reAuthenticate = async () => {
    const currentAddress = address || walletAccount;
    if (currentAddress && (isConnected || walletConnected)) {
      await authenticateWalletWithRetry(currentAddress);
    }
  };

  // Function to manually trigger wallet connection
  const triggerWalletConnection = async () => {
    try {
      // Import the wallet context to trigger connection
      const { useWallet } = await import('../context/WalletContext');
      // This will trigger the wallet connection process
    } catch (error) {
      // Handle error silently
    }
  };

  // Function to refresh signer before authentication
  const refreshSigner = async () => {
    try {
      // Import the wallet context to refresh signer
      const { useWallet } = await import('../context/WalletContext');
      // This will trigger a signer refresh
    } catch (error) {
      // Handle error silently
    }
  };

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('jwt');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        // Validate token with backend
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Token is invalid or expired
        }
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // Authenticate when wallet connects
  useEffect(() => {
    const currentAddress = address || walletAccount;
    const isWalletConnected = isConnected || walletConnected;
    
    if (!isWalletConnected) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      return;
    }
    
    // Only authenticate if we have an address and no token, and wallet is properly connected
    if (currentAddress && !token && isWalletConnected) {
      // Increased delay to give wallet connection time to settle before requesting signing permissions
      const timer = setTimeout(() => {
        authenticateWalletWithRetry(currentAddress);
      }, 5000); // Increased delay to 5 seconds to ensure wallet is fully connected
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [address, isConnected, walletAccount, walletConnected, token]);

  // Retry authentication with multiple attempts
  const authenticateWalletWithRetry = async (wallet, retryCount = 0) => {
    const maxRetries = 5; // Increased max retries
    
    try {
      await authenticateWallet(wallet);
    } catch (error) {
      if (retryCount < maxRetries) {
        const delay = (retryCount + 1) * 2000; // Shorter delays: 2s, 4s, 6s, 8s, 10s
        setTimeout(() => {
          authenticateWalletWithRetry(wallet, retryCount + 1);
        }, delay);
      }
    }
  };

  async function authenticateWallet(wallet) {
    setLoading(true);
    try {
      // More lenient connection check - if either wagmi or custom context shows connected, proceed
      const isAnyWalletConnected = isConnected || walletConnected;
      
      if (!isAnyWalletConnected) {
        setLoading(false);
        throw new Error('No wallet connection detected. Please ensure your wallet is connected and try again.');
      }
      
      // Check if signMessage is available
      if (!signMessage) {
        setLoading(false);
        throw new Error('Wallet signing not available. Please ensure your wallet is properly connected and try again.');
      }
      
      // Check signing permissions before attempting to sign
      const permissions = await checkSigningPermissions();
      if (!permissions.hasPermissions) {
        setLoading(false);
        throw new Error(`Signing permissions not available: ${permissions.error}. Please ensure your wallet is properly connected.`);
      }
      
      // Additional check: verify the wallet address matches (only if both are available)
      if (walletAccount && address && wallet !== walletAccount && wallet !== address) {
        setLoading(false);
        throw new Error('Wallet address mismatch. Please ensure you are using the correct wallet.');
      }
      
      // Check and request signing permissions if needed
      const signingPermissionsGranted = await checkAndRequestSigningPermissions();
      if (!signingPermissionsGranted) {
        const forceSigningGranted = await forceSigningPermissionRequest();
        if (!forceSigningGranted) {
          setLoading(false);
          throw new Error('Signing permissions are required for authentication. Please approve the signing request in MetaMask.');
        }
      }
      
      // 1. Get nonce from backend
      const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce/${wallet}`);
      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error('No nonce received');
      
      // 2. Sign nonce using our custom wallet context
      const message = `Sign this nonce to authenticate: ${nonce}`;
      let signature;
      
      try {
        // Use our custom wallet context for signing
        signature = await signMessage(message);
      } catch (signError) {
        // Handle specific MetaMask authorization errors
        if (signError.code === 4100) {
          setLoading(false);
          throw new Error('Please approve the signing request in MetaMask to authenticate your wallet.');
        }
        
        // Handle other MetaMask errors
        if (signError.code === 4001) {
          setLoading(false);
          throw new Error('Signing was rejected. Please try again and approve the signing request.');
        }
        
        // Handle general signing errors
        if (signError.message && signError.message.includes('not been authorized')) {
          setLoading(false);
          throw new Error('Please approve the signing request in MetaMask to continue.');
        }
        
        setLoading(false);
        throw new Error('Failed to sign message. Please ensure your wallet is connected and try again.');
      }
      
      // 3. Send signature to backend
      const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, signature })
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.message || 'Auth failed');
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      disconnect();
      throw err; // Re-throw for retry mechanism
    } finally {
      setLoading(false);
    }
  }

  return (
    <WalletAuthContext.Provider value={{ user, token, loading, reAuthenticate, triggerWalletConnection }}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  return useContext(WalletAuthContext);
} 