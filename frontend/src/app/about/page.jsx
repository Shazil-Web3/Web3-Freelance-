'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Simple SVG Icons
const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ZapIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-12 lg:px-28 relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-success/25 via-background to-accent/25" />
          <div className="absolute -top-32 -left-80 w-[40rem] h-[40rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.28)_0%,_transparent_70%)]" />
          <div className="absolute top-1/2 right-[-25rem] w-[40rem] h-[40rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.24)_0%,_transparent_70%)] -translate-y-1/2" />

          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl lg:text-7xl font-bold mb-8">
                About <span className="text-gradient-green">Leavon</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-3xl mx-auto">
                We're revolutionizing the freelance economy through blockchain technology,
                creating a transparent, secure, and efficient platform for Web3 talent worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-12 lg:px-28 relative overflow-hidden w-full">
          {/* Gradient orbs for Mission section */}
          <div className="absolute top-[-8rem] left-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)]" />
          <div className="absolute bottom-[-6rem] right-[-10rem] w-[22rem] h-[22rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.20)_0%,_transparent_70%)]" />
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Our <span className="text-gradient-orange">Mission</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  To democratize access to Web3 talent and create a trustless environment
                  where clients and freelancers can collaborate with complete transparency
                  and security.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  By leveraging smart contracts and blockchain technology, we eliminate
                  the need for intermediaries while ensuring fair payment distribution
                  and project milestone verification.
                </p>
              </div>
              <div className="space-y-4">
                <div className="card-floating p-4">
                  <ShieldIcon className="w-8 h-8 text-success mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                  <p className="text-muted-foreground">
                    Smart contract escrow ensures secure, automated payments upon milestone completion.
                  </p>
                </div>
                <div className="card-floating p-4">
                  <GlobeIcon className="w-8 h-8 text-accent mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Global Access</h3>
                  <p className="text-muted-foreground">
                    Connect with Web3 talent from around the world, breaking down geographical barriers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-12 lg:px-28 relative overflow-hidden w-full">
          {/* Gradient orbs for Values section */}
          <div className="absolute top-1/2 left-[-14rem] w-[26rem] h-[26rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.24)_0%,_transparent_70%)] -translate-y-1/2" />
          <div className="absolute bottom-[-8rem] right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.22)_0%,_transparent_70%)]" />
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">
                Our <span className="text-gradient-green">Values</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                These core principles guide everything we do at Leavon
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-floating p-6 text-center">
                <UsersIcon className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Community First</h3>
                <p className="text-muted-foreground">
                  Building a supportive ecosystem where both clients and freelancers thrive together.
                </p>
              </div>
              <div className="card-floating p-6 text-center">
                <CheckCircleIcon className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Transparency</h3>
                <p className="text-muted-foreground">
                  Every transaction, milestone, and payment is recorded on-chain for complete visibility.
                </p>
              </div>
              <div className="card-floating p-6 text-center">
                <ZapIcon className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  Continuously pushing the boundaries of what's possible in the freelance economy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-12 lg:px-28 relative overflow-hidden w-full">
          {/* Gradient orbs for Stats section */}
          <div className="absolute top-[-6rem] left-1/3 w-[22rem] h-[22rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.20)_0%,_transparent_70%)]" />
          <div className="absolute bottom-[-10rem] right-[-14rem] w-[26rem] h-[26rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.24)_0%,_transparent_70%)]" />
          <div className="container mx-auto">
            <div className="card-floating p-10">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold mb-4">
                  Leavon by the <span className="text-gradient-orange">Numbers</span>
                </h2>
                <p className="text-xl text-muted-foreground">Our impact on the Web3 freelance ecosystem</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gradient-green mb-2">10,000+</div>
                  <div className="text-muted-foreground">Active Freelancers</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gradient-orange mb-2">$50M+</div>
                  <div className="text-muted-foreground">Total Paid Out</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gradient-green mb-2">99.8%</div>
                  <div className="text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gradient-orange mb-2">150+</div>
                  <div className="text-muted-foreground">Countries</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-12 lg:px-28 relative overflow-hidden w-full">
          {/* Gradient orbs for Team section */}
          <div className="absolute top-0 left-1/4 w-[22rem] h-[22rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.22)_0%,_transparent_70%)]" />
          <div className="absolute bottom-[-8rem] right-[-10rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)]" />
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">
                Meet Our <span className="text-gradient-green">Team</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Passionate Web3 professionals building the future of freelance work
              </p>
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <div className="card-floating p-10">
                <TrendingUpIcon className="w-16 h-16 text-accent mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Building the Future</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our diverse team of blockchain developers, designers, and business strategists
                  is united by a shared vision: creating a more equitable and efficient
                  freelance economy powered by Web3 technology.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
