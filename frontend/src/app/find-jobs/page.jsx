import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const FindJobsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 px-12 lg:px-28">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden w-full">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-background to-accent/10" />

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                Explore <span className="text-gradient-green">Job Opportunities</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find your dream job in the Web3 space.
              </p>
            </div>
            
            {/* Job Listings Placeholder */}
            <div className="grid gap-8">
              {/* Example Jobs */}
              <div className="card-floating p-6">
                <h2 className="text-2xl font-bold">Smart Contract Developer</h2>
                <p className="text-muted-foreground">Company: Blockchain Innovators</p>
                <p className="text-muted-foreground">Location: Remote</p>
              </div>
              <div className="card-floating p-6">
                <h2 className="text-2xl font-bold">Full Stack Developer</h2>
                <p className="text-muted-foreground">Company: Crypto Corp</p>
                <p className="text-muted-foreground">Location: San Francisco</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FindJobsPage;

