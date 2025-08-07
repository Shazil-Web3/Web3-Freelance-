'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const WalletAuthContext = createContext();

export function WalletAuthProvider({ children }) {
  const { signMessage, isConnected, account } = useWallet();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('jwt');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
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
    if (!isConnected || !account) {
      setUser(null);
      setToken(null);
      setAuthError(null);
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      return;
    }
    
    // Only authenticate if we have an account and no token
    if (account && !token && isConnected) {
      authenticateWallet(account);
    }
  }, [account, isConnected, token]);

  async function authenticateWallet(wallet) {
    setLoading(true);
    setAuthError(null);
    
    try {
      if (!isConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      if (!signMessage) {
        throw new Error('Wallet signing not available. Please ensure your wallet is properly connected.');
      }
      
      // 1. Get nonce from backend
      const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce/${wallet}`);
      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication nonce');
      }
      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error('No nonce received');
      
      // 2. Sign nonce
      const message = `Sign this nonce to authenticate: ${nonce}`;
      let signature;
      
      try {
        signature = await signMessage(message);
      } catch (signError) {
        if (signError.code === 4100) {
          throw new Error('Please approve the signing request in MetaMask to authenticate your wallet.');
        }
        
        if (signError.code === 4001) {
          throw new Error('Signing was rejected. Please try again and approve the signing request.');
        }
        
        throw new Error('Failed to sign message. Please ensure your wallet is connected and try again.');
      }
      
      // 3. Send signature to backend
      const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, signature })
      });
      
      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const data = await verifyRes.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
    } catch (err) {
      setUser(null);
      setToken(null);
      setAuthError(err.message);
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }

  // Function to re-authenticate wallet
  const reAuthenticate = async () => {
    if (account && isConnected) {
      await authenticateWallet(account);
    }
  };

  return (
    <WalletAuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      authError,
      reAuthenticate 
    }}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  return useContext(WalletAuthContext);
} 