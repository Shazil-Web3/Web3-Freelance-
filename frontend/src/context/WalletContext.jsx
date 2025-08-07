"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  };

  // Get the provider
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('Please install MetaMask to use this application');
      return false;
    }

    if (isConnecting) {
      return false;
    }

    setIsConnecting(true);
    
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }

      // Request accounts
      const accounts = await provider.send('eth_requestAccounts', []);
      const account = accounts[0];

      if (!account) {
        throw new Error('No accounts found');
      }

      // Get signer
      const signer = await provider.getSigner();
      if (!signer) {
        throw new Error('Failed to get signer');
      }
      
      // Get chain ID
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      // Update state
      setAccount(account);
      setProvider(provider);
      setSigner(signer);
      setIsConnected(true);
      setChainId(chainId);

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccount', account);

      return true;
    } catch (error) {
      if (error.code === -32002) {
        // MetaMask is already processing a request
        return false;
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);

    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAccount');
  };

  // Auto-reconnect on page load
  const autoReconnect = async () => {
    if (typeof window === 'undefined') return;

    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const savedAccount = localStorage.getItem('walletAccount');

    if (wasConnected && savedAccount && isMetaMaskInstalled()) {
      try {
        const provider = getProvider();
        if (!provider) return;

        // Check if the saved account is still connected
        const accounts = await provider.listAccounts();
        const isStillConnected = accounts.some(acc => {
          const accountAddress = typeof acc === 'string' ? acc : acc.address;
          return accountAddress.toLowerCase() === savedAccount.toLowerCase();
        });

        if (isStillConnected) {
          const signer = await provider.getSigner();
          if (!signer) return;
          
          const network = await provider.getNetwork();
          
          setAccount(savedAccount);
          setProvider(provider);
          setSigner(signer);
          setIsConnected(true);
          setChainId(network.chainId);
        } else {
          // Account is no longer connected, clear storage
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAccount');
        }
      } catch (error) {
        // Clear storage on error
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAccount');
      }
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      const newAccount = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].address;
      if (newAccount !== account) {
        setAccount(newAccount);
        localStorage.setItem('walletAccount', newAccount);
      }
    }
  };

  // Handle chain changes
  const handleChainChanged = (chainId) => {
    setChainId(parseInt(chainId, 16));
    // Reload the page on chain change (MetaMask recommendation)
    window.location.reload();
  };

  // Setup event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Auto-reconnect on mount
    autoReconnect();

    // Setup event listeners for MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Get contract instance
  const getContract = (address, abi) => {
    if (!signer) return null;
    return new ethers.Contract(address, abi, signer);
  };

  // Sign message
  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('No signer available. Please connect your wallet first.');
    }
    
    if (!isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      if (error.code === 4100) {
        throw new Error('Please approve the signing request in MetaMask to authenticate your wallet.');
      }
      
      if (error.code === 4001) {
        throw new Error('Signing was rejected. Please try again and approve the signing request.');
      }
      
      throw error;
    }
  };

  // Send transaction
  const sendTransaction = async (transaction) => {
    if (!signer) {
      throw new Error('No signer available');
    }
    return await signer.sendTransaction(transaction);
  };

  const value = {
    account,
    provider,
    signer,
    isConnecting,
    isConnected,
    chainId,
    connectWallet,
    disconnectWallet,
    getContract,
    signMessage,
    sendTransaction,
    isMetaMaskInstalled
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 