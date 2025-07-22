import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const PostAJobPage = () => {
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
                Post a <span className="text-gradient-green">Job</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect with top Web3 talent by posting your project. Find the perfect freelancer for your needs.
              </p>
            </div>
            
            {/* Enhanced Job Posting Form Placeholder */}
            <div className="grid gap-8 max-w-2xl mx-auto">
              <div className="card-floating p-8 bg-white/80 shadow-lg rounded-2xl">
                <h2 className="text-2xl font-bold mb-2">How it Works</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Describe your project and required skills.</li>
                  <li>Set your budget and timeline.</li>
                  <li>Review applications from vetted freelancers.</li>
                  <li>Hire and collaborate securely via smart contracts.</li>
                </ul>
                <button className="mt-6 btn-primary w-full py-3 text-lg font-semibold rounded-xl">Start Posting</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PostAJobPage;

