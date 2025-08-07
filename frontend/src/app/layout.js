"use client"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from "../components/Web3Provider";
import { WalletAuthProvider } from '../components/WalletAuthProvider';
import { ContractProvider } from '../context/ContractContext';
import Lenis from 'lenis';
import { useEffect } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smooth: true,
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <WalletAuthProvider>
            <ContractProvider>
              {children}
            </ContractProvider>
          </WalletAuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
