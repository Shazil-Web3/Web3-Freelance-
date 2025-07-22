"use client";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiConfig, createConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, sepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const chains = [mainnet, polygon, optimism, arbitrum, sepolia];

// IMPORTANT: Replace this with your actual WalletConnect Project ID from https://cloud.walletconnect.com/
const WALLETCONNECT_PROJECT_ID = "675d5fe0c8f4bada811827dc9e534fb6"; // <-- Replace this!

const { connectors } = getDefaultWallets({
  appName: "Leavon",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  chains,
});

export default function Web3Provider({ children }) {
  // Ensure QueryClient is not recreated on every render
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
} 