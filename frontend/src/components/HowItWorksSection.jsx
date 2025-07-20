'use client';

import React from "react";

// Simple SVG Icons
const FileTextIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const CreditCardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const steps = [
  {
    icon: FileTextIcon,
    title: "Post Job",
    description: "Create detailed project requirements with smart contract milestones and budget allocation.",
    number: "01"
  },
  {
    icon: UsersIcon,
    title: "Apply",
    description: "Verified Web3 freelancers submit proposals with portfolios and competitive rates.",
    number: "02"
  },
  {
    icon: CreditCardIcon,
    title: "Get Paid",
    description: "Automatic milestone-based payments through secure escrow smart contracts.",
    number: "03"
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative overflow-hidden w-full max-w-full">
      {/* Enhanced darker and larger glow orbs */}
      <div className="absolute top-[-10rem] left-[-16rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)]" />
      <div className="absolute bottom-[-8rem] right-[-20rem] w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)]" />
      <div className="absolute top-1/3 right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)]" />
      <div className="absolute bottom-1/4 left-[-10rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How <span className="text-gradient-green">Leavon</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to connect, collaborate, and complete projects 
            with blockchain-powered security.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-success/30 to-transparent z-0" />
                )}

                <div className="card-floating p-8 text-center h-full relative z-10">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-success/20 to-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-10 h-10 text-success" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <button className="btn-primary">
            Start Your First Project
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
