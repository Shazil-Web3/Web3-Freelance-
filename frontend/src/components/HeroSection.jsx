"use client";

// Simple SVG Icons
const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const PlayIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden w-full max-w-full">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-background to-accent/20" />
      
      {/* Glow orbs: same intensity, reduced size */}
      <div className="absolute -top-20 -left-56 w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)]" />
      <div className="absolute top-1/2 right-[-16rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
      <div className="absolute bottom-[-10rem] left-1/4 w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-8 lg:px-20 pt-32 pb-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Hire Top{" "}
                <span className="text-gradient-green">Web3 Talent</span>
                {" "}— Instantly
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Leavon connects clients with expert blockchain developers, designers, 
                and strategists worldwide through secure smart contract technology.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/find-jobs" className="btn-primary group">
                Post a Job
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/apply-for-jobs" className="btn-secondary group">
                <PlayIcon className="mr-2 h-5 w-5" />
                Join as Freelancer
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-orange">10k+</div>
                <div className="text-sm text-muted-foreground">Active Freelancers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-orange">$50M+</div>
                <div className="text-sm text-muted-foreground">Paid Out</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-orange">99.8%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden card-floating float">
              <img
                src="1.jpg"
                alt="Web3 collaboration and smart contract handshake"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-success/10 to-transparent" />
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 card-floating bg-white p-4 float-delayed">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium">Live Platform</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 card-floating bg-white p-4 float">
              <div className="text-center">
                <div className="text-lg font-bold text-gradient-green">100%</div>
                <div className="text-xs text-muted-foreground">Secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
