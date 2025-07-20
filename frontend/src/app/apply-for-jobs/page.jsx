import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const ApplyForJobsPage = () => {
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
                Join as a <span className="text-gradient-green">Freelancer</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Apply to exciting Web3 projects and build your freelance career.
              </p>
            </div>

            {/* Application Guidelines Placeholder */}
            <div className="grid gap-8">
              <div className="card-floating p-6">
                <h2 className="text-2xl font-bold">How to Apply</h2>
                <p className="text-muted-foreground">Register as a freelancer and start applying for jobs that match your skills.</p>
                <p className="text-muted-foreground">Ensure your profile is complete for the best opportunities.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ApplyForJobsPage;

