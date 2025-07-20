import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import BenefitsSection from '../components/BenefitsSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ReviewsSection from '../components/ReviewsSection';
import FAQSection from '../components/FAQSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
      <HeroSection />
        <HowItWorksSection />
        <ReviewsSection />
        <BenefitsSection />
        <CTASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
