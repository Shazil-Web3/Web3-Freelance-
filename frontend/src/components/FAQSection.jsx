"use client";
import { useState } from "react";

// Simple SVG Icons
const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const faqs = [
  {
    question: "How are payments secured on Leavon?",
    answer:
      "All payments are secured through smart contract escrow systems. Funds are locked in the contract when a project begins and automatically released when milestones are completed and approved. This ensures both clients and freelancers are protected.",
  },
  {
    question: "What tokens are supported for payments?",
    answer:
      "We currently support major cryptocurrencies including ETH, USDC, USDT, and DAI. We're continuously adding support for more tokens based on community demand and security audits.",
  },
  {
    question: "Is KYC required to use the platform?",
    answer:
      "Basic KYC is required for freelancers to ensure platform security and comply with regulations. Clients have optional KYC for higher transaction limits. The process is streamlined and typically takes 24-48 hours.",
  },
  {
    question: "How does the milestone system work?",
    answer:
      "Projects are broken into clear milestones with defined deliverables and timelines. Payments are released automatically when milestones are marked complete by clients. This ensures steady progress and fair compensation.",
  },
  {
    question: "What happens if there's a dispute?",
    answer:
      "Our decentralized arbitration system involves verified community mediators who review evidence and make binding decisions. Disputed funds remain in escrow until resolution, protecting both parties.",
  },
  {
    question: "Are smart contracts audited for security?",
    answer:
      "Yes, all our smart contracts undergo rigorous security audits by leading blockchain security firms. Audit reports are publicly available, and we maintain bug bounty programs for continuous security testing.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-secondary/20 relative overflow-hidden w-full max-w-full">
      {/* Enhanced darker and larger glow orbs */}
      <div className="absolute top-1/2 left-[-16rem] w-[28rem] h-[28rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
      <div className="absolute bottom-[-8rem] right-1/3 w-[32rem] h-[32rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)]" />
      <div className="absolute top-[-6rem] right-[-12rem] w-[24rem] h-[24rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.14)_0%,_transparent_70%)]" />
      <div className="absolute bottom-1/3 left-[-10rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.12)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Frequently Asked{" "}
            <span className="text-gradient-green">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about getting started with Web3 freelancing on Leavon.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <div className="card-floating overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-secondary/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  {openIndex === index ? (
                    <ChevronUpIcon className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Still have questions? Our support team is here to help.
          </p>
          <button className="btn-secondary">Contact Support</button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
