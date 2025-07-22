import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const ApplyForJobsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 px-12 lg:px-28">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden w-full">
          {/* Enhanced Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-background to-accent/20" />

          <div className="container mx-auto relative z-10">
            <div className="text-center mb-14">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                Apply for a <span className="text-gradient-green">Job</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover exciting Web3 projects and take the next step in your freelance career.
              </p>
            </div>

            {/* Enhanced Application Guidelines */}
            <div className="grid gap-8 max-w-2xl mx-auto">
              <div className="card-floating p-8 bg-white/80 shadow-lg rounded-2xl">
                <h2 className="text-2xl font-bold mb-2">How to Apply</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Register and complete your freelancer profile.</li>
                  <li>Browse available jobs that match your skills.</li>
                  <li>Submit tailored applications to stand out.</li>
                  <li>Get hired and work securely via smart contracts.</li>
                </ul>
                <button className="mt-6 btn-primary w-full py-3 text-lg font-semibold rounded-xl">Browse Jobs</button>
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

