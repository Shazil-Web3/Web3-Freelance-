// Simple SVG Icons
const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ZapIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden w-full max-w-full">
      {/* Gradient background - darker and larger */}
      <div className="absolute inset-0 bg-gradient-to-br from-success/18 via-background to-accent/18" />
      {/* Enhanced darker and larger animated glow orbs */}
      <div className="absolute top-1/2 left-1/4 w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/4 left-[-12rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)]" />
      <div className="absolute top-[-8rem] right-[-16rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-floating p-12 lg:p-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-8">
              <ZapIcon className="w-4 h-4" />
              <span className="font-medium">Ready to get started?</span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              Start Your{" "}
              <span className="text-gradient-orange">Web3 Hiring</span>{" "}
              Journey Today
            </h2>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of successful Web3 projects that have found their
              perfect freelance talent through our secure, transparent platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="btn-primary text-lg px-10 py-5 group">
                Post Your First Job
                <ArrowRightIcon className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="btn-secondary text-lg px-10 py-5">
                Browse Freelancers
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Average time to hire
                </div>
                <div className="text-2xl font-bold text-gradient-green">
                  24 hours
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Project success rate
                </div>
                <div className="text-2xl font-bold text-gradient-orange">
                  99.8%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Cost savings vs traditional
                </div>
                <div className="text-2xl font-bold text-gradient-green">
                  40%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
