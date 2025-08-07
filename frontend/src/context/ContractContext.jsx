"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import JobAsCrewOneContext from './Rcontext';
import { useWallet } from './WalletContext';

const ContractContext = createContext();

export function ContractProvider({ children }) {
  const { account, isConnected, signer } = useWallet();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x670D7916E96A08c2d1bF3FFb538f4B99b433bEde';

  // Initialize contract when wallet connects
  useEffect(() => {
    let mounted = true;

    const initializeContract = async () => {
      if (!isConnected || !account) {
        if (mounted) {
          setContract(null);
          setLoading(false);
          setError(null);
          setIsInitialized(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if MetaMask is available
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('MetaMask is not installed');
        }

        // Create contract instance
        const contractInstance = await JobAsCrewOneContext.createAsync(CONTRACT_ADDRESS, window.ethereum);
        
        if (mounted) {
          setContract(contractInstance);
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize global contract context:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
          setContract(null);
          setIsInitialized(false);
        }
      }
    };

    // Add a small delay to ensure wallet is fully connected
    const timer = setTimeout(() => {
      initializeContract();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isConnected, account, CONTRACT_ADDRESS]);

  // Handle wallet disconnection
  useEffect(() => {
    if (!isConnected) {
      setContract(null);
      setError(null);
      setIsInitialized(false);
    }
  }, [isConnected]);

  // Handle account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        setContract(null);
        setError(null);
        setIsInitialized(false);
      } else {
        // User switched accounts, reinitialize contract
        if (isConnected && account) {
          const initializeContract = async () => {
            try {
              const contractInstance = await JobAsCrewOneContext.createAsync(CONTRACT_ADDRESS, window.ethereum);
              setContract(contractInstance);
              setError(null);
              setIsInitialized(true);
            } catch (err) {
              console.error('Failed to reinitialize contract after account change:', err);
              setError(err.message);
              setContract(null);
              setIsInitialized(false);
            }
          };
          initializeContract();
        }
      }
    };

    const handleChainChanged = () => {
      // Reload the page on chain change (MetaMask recommendation)
      window.location.reload();
    };

    // Add event listeners
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isConnected, account, CONTRACT_ADDRESS]);

  const value = {
    contract,
    loading,
    error,
    isInitialized,
    address: account,
    isConnected
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}