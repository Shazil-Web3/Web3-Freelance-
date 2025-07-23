"use client";
import { useState, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

// Simple SVG Icons
const MenuIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WalletIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const navigation = [
  { name: "How it Works", href: "#how-it-works", scrollTo: true },
  { name: "Find Talent", href: "#cta-section", scrollTo: true },
  { name: "Browse Talent", href: "#cta-section", scrollTo: true },
  { name: "About", href: "/about", scrollTo: false },
  { name: "Dashboard", href: "/dashboard", scrollTo: false }
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useAccount();
  const [walletLoaded, setWalletLoaded] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure wallet UI is properly loaded
    const timer = setTimeout(() => {
      setWalletLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleNavClick = (e, item) => {
    if (item.scrollTo) {
      e.preventDefault();
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border/50 z-50">
      <nav className="container mx-auto px-8 lg:px-12 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="focus:outline-none">
              <h1 className="text-2xl font-bold text-gradient-green">Leavon</h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {walletLoaded ? (
              <div className={`wallet-gradient-btn ${isConnected ? 'wallet-connected' : ''}}`}>
                <ConnectButton showBalance={false} />
              </div>
            ) : (
              <div className="h-10 w-36 rounded-xl bg-secondary animate-pulse"></div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50">
            <div className="flex flex-col space-y-4 pt-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                {walletLoaded ? (
                  <div className={`wallet-gradient-btn ${isConnected ? 'wallet-connected' : ''}`}>
                    <ConnectButton showBalance={false} />
                  </div>
                ) : (
                  <div className="h-10 w-36 rounded-xl bg-secondary animate-pulse"></div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export { Header };
