"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import FeatureSection from "./FeatureSection";
import PrivacySection from "./PrivacySection";
import WorkflowSection from "./WorkflowSection";
import CTASection from "./CTASection";
import LoadingScreen from "./LoadingScreen";
import Footer from "./Footer";

export default function LandingWrapper() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <Navbar />
      <main>
        <Hero />
        <FeatureSection />
        <PrivacySection />
        <WorkflowSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
