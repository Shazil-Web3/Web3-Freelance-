'use client';

import React from "react";

// Simple SVG Icons
const StarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const reviews = [
  {
    name: "Sarah Chen",
    role: "DeFi Startup Founder",
    avatar: "1",
    rating: 5,
    text: "Found an amazing Solidity developer within 24 hours. The smart contract escrow gave me complete peace of mind throughout the project."
  },
  {
    name: "Marcus Rodriguez",
    role: "Blockchain Consultant",
    avatar: "2", 
    rating: 5,
    text: "As a freelancer, Leavon's milestone system ensures I get paid on time, every time. The platform fee is fair and the community is top-notch."
  },
  {
    name: "Elena Volkov",
    role: "NFT Project Manager",
    avatar: "3",
    rating: 5,
    text: "The quality of Web3 talent here is unmatched. Successfully launched our NFT marketplace with developers I found on Leavon."
  },
  {
    name: "David Kim",
    role: "DAO Operations Lead",
    avatar: "4",
    rating: 5,
    text: "Transparent, secure, and efficient. This is how freelance platforms should work in the Web3 era. Highly recommend!"
  },
  {
    name: "Rachel Thompson",
    role: "Crypto Exchange CTO",
    avatar: "5",
    rating: 5,
    text: "Built our entire trading platform backend with Leavon freelancers. The smart contract payment system is revolutionary."
  },
  {
    name: "Alex Petrov",
    role: "GameFi Developer",
    avatar: "6",
    rating: 5,
    text: "Love the milestone-based approach. It keeps projects on track and ensures fair compensation for quality work delivered."
  }
];

const ReviewsSection = () => {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden w-full max-w-full">
      {/* Enhanced darker and larger glow orbs */}
      <div className="absolute top-1/3 left-[-20rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)]" />
      <div className="absolute bottom-1/4 right-[-16rem] w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)]" />
      <div className="absolute top-[-8rem] right-1/4 w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.14)_0%,_transparent_70%)]" />
      <div className="absolute bottom-[-6rem] left-1/3 w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.12)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full mb-6">
            <ShieldIcon className="w-4 h-4" />
            <span className="font-medium">Trusted by thousands of Web3 professionals</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            What Our <span className="text-gradient-orange">Community</span> Says
          </h2>

          {/* Rating Summary */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="w-6 h-6 fill-accent text-accent" />
              ))}
            </div>
            <div className="text-2xl font-bold">4.9</div>
            <div className="text-muted-foreground">from 2,847 reviews</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => {
            const row = Math.floor((parseInt(review.avatar) - 1) / 3);
            const col = (parseInt(review.avatar) - 1) % 3;

            return (
              <div
                key={index}
                className="card-floating p-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{review.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-success/20 to-accent/20">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url("https://via.placeholder.com/50x50")`,
                        backgroundPosition: `${col * -100}% ${row * -100}%`,
                        transform: `scale(3) translate(${col * 33.33}%, ${row * 33.33}%)`
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold">{review.name}</div>
                    <div className="text-sm text-muted-foreground">{review.role}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
