import { useWallet } from '../context/WalletContext';

export const useWalletConnection = () => {
  const wallet = useWallet();
  
  return {
    account: wallet.account,
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    connectWallet: wallet.connectWallet,
    disconnectWallet: wallet.disconnectWallet,
    signer: wallet.signer,
    provider: wallet.provider,
    getContract: wallet.getContract,
    signMessage: wallet.signMessage,
    sendTransaction: wallet.sendTransaction,
    forceReconnect: wallet.forceReconnect,
    checkSigningPermissions: wallet.checkSigningPermissions,
    checkAndRequestSigningPermissions: wallet.checkAndRequestSigningPermissions,
    forceSigningPermissionRequest: wallet.forceSigningPermissionRequest
  };
}; 