'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { ethers } from 'ethers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const WalletAuthContext = createContext();

export function WalletAuthProvider({ children }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      return;
    }
    if (address) {
      authenticateWallet(address);
    }
    // eslint-disable-next-line
  }, [address, isConnected]);

  async function authenticateWallet(wallet) {
    setLoading(true);
    try {
      // 1. Get nonce from backend
      const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce/${wallet}`);
      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error('No nonce received');
      // 2. Sign nonce
      const message = `Sign this nonce to authenticate: ${nonce}`;
      const signature = await signMessageAsync({ message });
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
      console.error('Wallet authentication failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <WalletAuthContext.Provider value={{ user, token, loading }}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  return useContext(WalletAuthContext);
} 