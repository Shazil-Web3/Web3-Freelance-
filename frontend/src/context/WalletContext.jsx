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
  const [pendingRequest, setPendingRequest] = useState(false);

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

  // Connect wallet with request management
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('Please install MetaMask to use this application');
      return false;
    }

    // Prevent duplicate requests
    if (isConnecting || pendingRequest) {
      return false;
    }

    setIsConnecting(true);
    setPendingRequest(true);
    
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }

      // Check if already connected
      const existingAccounts = await provider.listAccounts();
      if (existingAccounts.length > 0) {
        const accountObj = existingAccounts[0];
        const account = typeof accountObj === 'string' ? accountObj : accountObj.address;
        
        // Ensure we get a fresh signer
        const signer = await provider.getSigner();
        if (!signer) {
          throw new Error('Failed to get signer for existing account');
        }
        
        const network = await provider.getNetwork();
        
        setAccount(account);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        setChainId(network.chainId);
        
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccount', account);
        
        return true;
      }

      // Request accounts with error handling
      const accounts = await provider.send('eth_requestAccounts', []);
      const account = accounts[0];

      if (!account) {
        throw new Error('No accounts found');
      }

      // Get signer - ensure it's properly initialized
      const signer = await provider.getSigner();
      if (!signer) {
        throw new Error('Failed to get signer after account request');
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

      // Store connection state in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccount', account);

      return true;
    } catch (error) {
      // Handle specific MetaMask errors
      if (error.code === -32002) {
        // Don't show error to user, just wait
        return false;
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
      return false;
    } finally {
      setIsConnecting(false);
      setPendingRequest(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);

    // Clear localStorage
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
          // Handle both string and object account formats
          const accountAddress = typeof acc === 'string' ? acc : acc.address;
          return accountAddress.toLowerCase() === savedAccount.toLowerCase();
        });

        if (isStillConnected) {
          // Ensure we get a fresh signer
          const signer = await provider.getSigner();
          if (!signer) {
            return;
          }
          
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

  // Enhanced auto-reconnect that also checks wagmi state
  const enhancedAutoReconnect = async () => {
    if (typeof window === 'undefined') return;

    // Prevent duplicate requests
    if (isConnecting || pendingRequest) {
      return;
    }

    try {
      // First try our own auto-reconnect
      await autoReconnect();
      
      // If we're still not connected but MetaMask is available, try to connect
      if (!isConnected && isMetaMaskInstalled()) {
        const provider = getProvider();
        if (provider) {
          // Check if any accounts are available
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            // Try to connect with the first available account
            const accountObj = accounts[0];
            const account = typeof accountObj === 'string' ? accountObj : accountObj.address;
            
            // Ensure we get a fresh signer
            const signer = await provider.getSigner();
            if (!signer) {
              return;
            }
            
            const network = await provider.getNetwork();
            
            setAccount(account);
            setProvider(provider);
            setSigner(signer);
            setIsConnected(true);
            setChainId(network.chainId);
            
            // Update localStorage
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAccount', account);
          }
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Force reconnection when there's a mismatch
  const forceReconnect = async () => {
    if (!isMetaMaskInstalled()) {
      return false;
    }

    // Prevent duplicate requests
    if (isConnecting || pendingRequest) {
      return false;
    }

    setIsConnecting(true);
    setPendingRequest(true);
    
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error('No provider available');
      }

      // Clear any existing connection state
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setIsConnected(false);
      setChainId(null);

      // Check if already connected first
      const existingAccounts = await provider.listAccounts();
      if (existingAccounts.length > 0) {
        const accountObj = existingAccounts[0];
        const account = typeof accountObj === 'string' ? accountObj : accountObj.address;
        
        // Ensure we get a fresh signer
        const signer = await provider.getSigner();
        if (!signer) {
          throw new Error('Failed to get signer for existing account during force reconnect');
        }
        
        const network = await provider.getNetwork();
        
        setAccount(account);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        setChainId(network.chainId);
        
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccount', account);
        
        return true;
      }

      // Request accounts
      const accounts = await provider.send('eth_requestAccounts', []);
      const account = accounts[0];

      if (!account) {
        throw new Error('No accounts found');
      }

      // Get signer - ensure it's properly initialized
      const signer = await provider.getSigner();
      if (!signer) {
        throw new Error('Failed to get signer after account request during force reconnect');
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

      // Store connection state in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccount', account);

      return true;
    } catch (error) {
      // Handle specific MetaMask errors
      if (error.code === -32002) {
        // Don't show error to user, just wait
        return false;
      }
      
      return false;
    } finally {
      setIsConnecting(false);
      setPendingRequest(false);
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      // User switched accounts
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

    // Auto-reconnect on mount with delay to prevent conflicts
    const timer = setTimeout(() => {
      enhancedAutoReconnect();
    }, 1000);

    // Setup event listeners for MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        clearTimeout(timer);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
    
    return () => clearTimeout(timer);
  }, []);

  // Get contract instance
  const getContract = (address, abi) => {
    if (!signer) return null;
    return new ethers.Contract(address, abi, signer);
  };

  // Wait for signer to be available
  const waitForSigner = async (maxWaitTime = 10000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (signer && isConnected) {
        return signer;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before checking again
    }
    
    throw new Error('Signer not available after waiting');
  };

  // Sign message
  const signMessage = async (message) => {
    // Wait for signer to be available
    let currentSigner = signer;
    if (!currentSigner) {
      try {
        currentSigner = await waitForSigner();
      } catch (error) {
        throw new Error('No signer available. Please ensure your wallet is connected.');
      }
    }
    
    if (!isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    try {
      const signature = await currentSigner.signMessage(message);
      return signature;
    } catch (error) {
      // Handle MetaMask authorization errors
      if (error.code === 4100) {
        throw new Error('Please approve the signing request in MetaMask to authenticate your wallet.');
      }
      
      if (error.code === 4001) {
        throw new Error('Signing was rejected. Please try again and approve the signing request.');
      }
      
      if (error.message && error.message.includes('not been authorized')) {
        throw new Error('Please approve the signing request in MetaMask to continue.');
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

  // Check if wallet has signing permissions
  const checkSigningPermissions = async () => {
    if (!isMetaMaskInstalled()) {
      return { hasPermissions: false, error: 'MetaMask not installed' };
    }

    try {
      const provider = getProvider();
      if (!provider) {
        return { hasPermissions: false, error: 'No provider available' };
      }

      // Check if any accounts are available
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
        return { hasPermissions: false, error: 'No accounts available' };
      }

      // Try to get signer to check if signing is available
      const signer = await provider.getSigner();
      if (!signer) {
        return { hasPermissions: false, error: 'No signer available' };
      }

      return { hasPermissions: true, account: accounts[0] };
    } catch (error) {
      return { hasPermissions: false, error: error.message };
    }
  };

  // Check and request signing permissions if missing
  const checkAndRequestSigningPermissions = async () => {
    if (!signer || !isConnected) {
      return false;
    }

    try {
      const testMessage = 'Checking signing permissions for authentication';
      await signer.signMessage(testMessage);
      return true;
    } catch (signError) {
      if (signError.code === 4001) {
        return false;
      } else if (signError.code === 4100) {
        try {
          const explicitMessage = 'Please approve signing permissions to authenticate your wallet. This is required for using the application.';
          await signer.signMessage(explicitMessage);
          return true;
        } catch (retryError) {
          return false;
        }
      } else {
        return false;
      }
    }
  };

  // Force trigger signing permission request
  const forceSigningPermissionRequest = async () => {
    if (!signer || !isConnected) {
      return false;
    }

    try {
      const message = 'Please approve signing permissions to authenticate your wallet. This is required for using the application.';
      
      // Add a small delay to ensure MetaMask is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const signature = await signer.signMessage(message);
      return true;
    } catch (signError) {
      if (signError.code === 4001) {
        return false;
      } else if (signError.code === 4100) {
        // Try with a different message format
        try {
          const altMessage = 'Authentication required. Please sign this message to continue.';
          await signer.signMessage(altMessage);
          return true;
        } catch (altError) {
          return false;
        }
      } else {
        return false;
      }
    }
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
    isMetaMaskInstalled,
    forceReconnect,
    checkSigningPermissions,
    checkAndRequestSigningPermissions,
    forceSigningPermissionRequest
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 