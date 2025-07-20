// Simple SVG Icons
const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const LockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const benefits = [
  {
    icon: ShieldIcon,
    title: "Transparent Smart Contract Payments",
    description: "Every transaction is recorded on-chain with full transparency. No hidden fees or surprise deductions.",
    color: "success"
  },
  {
    icon: ClockIcon,
    title: "Milestone-based Delivery",
    description: "Break projects into clear milestones with automatic payments upon completion and approval.",
    color: "accent"
  },
  {
    icon: TrendingUpIcon,
    title: "Platform Owner Commission Automation",
    description: "Fair and transparent 5% commission automatically distributed through smart contracts.",
    color: "success"
  },
  {
    icon: LockIcon,
    title: "Decentralized Escrow Security",
    description: "Funds are securely held in smart contract escrow until project milestones are successfully delivered.",
    color: "accent"
  }
];

export const BenefitsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden w-full max-w-full">
      {/* Enhanced darker and larger glow orbs */}
      <div className="absolute top-[-10rem] right-[-24rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)]" />
      <div className="absolute bottom-[-14rem] left-[-20rem] w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)]" />
      <div className="absolute top-1/2 left-[-16rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
      <div className="absolute bottom-1/3 right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)]" />
      
      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Why Choose <span className="text-gradient-green">Leavon</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built on cutting-edge blockchain technology to revolutionize how 
            freelance work gets done in the Web3 ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="card-floating p-8 group hover:scale-105 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
                    ${benefit.color === 'success' 
                      ? 'bg-gradient-to-br from-success/20 to-success/10' 
                      : 'bg-gradient-to-br from-accent/20 to-accent/10'
                    }
                  `}>
                    <Icon className={`
                      w-8 h-8
                      ${benefit.color === 'success' ? 'text-success' : 'text-accent'}
                    `} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-gradient-green transition-all">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-8 p-6 card-floating bg-gradient-to-r from-success/5 to-accent/5">
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient-green">256-bit</div>
              <div className="text-sm text-muted-foreground">Encryption</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient-orange">Smart</div>
              <div className="text-sm text-muted-foreground">Contracts</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-gradient-green">Audited</div>
              <div className="text-sm text-muted-foreground">Security</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
