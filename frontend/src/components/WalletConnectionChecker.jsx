"use client";

import { useEffect, useState, useRef } from 'react';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useAccount } from 'wagmi';

export const WalletConnectionChecker = ({ children, requireConnection = false }) => {
  const { isConnected, isConnecting, connectWallet, forceReconnect } = useWalletConnection();
  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount();
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const lastAttemptRef = useRef(0);

  // Auto-connect if not connected and connection is required
  useEffect(() => {
    if (requireConnection && !isConnected && !isConnecting && !isAutoReconnecting && connectionAttempts < 2) {
      const now = Date.now();
      const timeSinceLastAttempt = now - lastAttemptRef.current;
      
      // Only attempt if enough time has passed (at least 2 seconds)
      if (timeSinceLastAttempt < 2000) {
        return;
      }
      
      // Check if we should attempt connection
      const shouldAttemptConnection = !isConnected && !isConnecting && (
        wagmiConnected || 
        localStorage.getItem('walletConnected') === 'true' ||
        localStorage.getItem('walletAccount')
      );
      
      if (!shouldAttemptConnection) {
        return;
      }
      
      const autoConnect = async () => {
        try {
          setIsAutoReconnecting(true);
          setConnectionAttempts(prev => prev + 1);
          lastAttemptRef.current = Date.now();
          await connectWallet();
        } catch (error) {
          // console.error('Auto-connect failed:', error);
        } finally {
          setIsAutoReconnecting(false);
        }
      };
      
      // Add a longer delay to ensure everything is initialized and no pending requests
      const timer = setTimeout(autoConnect, 2000);
      return () => clearTimeout(timer);
    }
  }, [requireConnection, isConnected, isConnecting, connectWallet, isAutoReconnecting, connectionAttempts, wagmiConnected]);

  // Detect connection mismatch and auto-fix
  useEffect(() => {
    if (requireConnection && !isAutoReconnecting && connectionAttempts < 2) {
      const now = Date.now();
      const timeSinceLastAttempt = now - lastAttemptRef.current;
      
      // Only attempt if enough time has passed (at least 3 seconds)
      if (timeSinceLastAttempt < 3000) {
        return;
      }
      
      // If wagmi shows connected but our context doesn't, trigger force reconnection
      if (wagmiConnected && wagmiAddress && !isConnected && !isConnecting) {
        const fixConnection = async () => {
          try {
            setIsAutoReconnecting(true);
            setConnectionAttempts(prev => prev + 1);
            lastAttemptRef.current = Date.now();
            // Use forceReconnect instead of connectWallet for better synchronization
            await forceReconnect();
          } catch (error) {
            // Handle error silently
          } finally {
            setIsAutoReconnecting(false);
          }
        };
        
        // Add a longer delay to ensure proper detection and no pending requests
        const timer = setTimeout(fixConnection, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [requireConnection, wagmiConnected, wagmiAddress, isConnected, isConnecting, forceReconnect, isAutoReconnecting, connectionAttempts]);

  // Reset connection attempts when successfully connected
  useEffect(() => {
    if (isConnected) {
      setConnectionAttempts(0);
      lastAttemptRef.current = 0;
    }
  }, [isConnected]);

  // If connection is required and not connected, show loading
  if (requireConnection && !isConnected && (isConnecting || isAutoReconnecting)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isAutoReconnecting ? 'Synchronizing wallet connection...' : 'Connecting wallet...'}
          </p>
          {connectionAttempts > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Attempt {connectionAttempts}/2
            </p>
          )}
        </div>
      </div>
    );
  }

  return children;
}; 