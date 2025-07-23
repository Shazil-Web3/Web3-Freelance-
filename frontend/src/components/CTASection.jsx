import React from "react";
import { ArrowRight, Zap } from "lucide-react";

const CTASection = () => {
  return (
    <section id="cta-section" className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-background to-accent/10" />

      {/* Animated glow orbs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 glow-orb animate-pulse" />
      <div
        className="absolute top-1/3 right-1/4 w-80 h-80 glow-orb-orange animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-floating p-12 lg:p-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-8">
              <Zap className="w-4 h-4" />
              <span className="font-medium">Ready to get started?</span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              Start Your <span className="text-gradient-orange">Web3 Hiring</span> Journey Today
            </h2>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of successful Web3 projects that have found their
              perfect freelance talent through our secure, transparent platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="/post-a-job" className="btn-primary text-lg px-10 py-5 group">
                Post Your First Job
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </a>

              <a href="/apply-for-jobs" className="btn-secondary text-lg px-10 py-5">
                Browse Freelancers
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Average time to hire</div>
                <div className="text-2xl font-bold text-gradient-green">24 hours</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Project success rate</div>
                <div className="text-2xl font-bold text-gradient-orange">99.8%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Cost savings vs traditional</div>
                <div className="text-2xl font-bold text-gradient-green">40%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
