import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VisualFeatureCards from "@/components/VisualFeatureCards";
import FeaturedJobs from "@/components/FeaturedJobs";
import FeatureCards from "@/components/FeatureCards";
import JobResults from "@/components/JobResults";

import WhyKanzleistelle from "@/components/WhyKanzleistelle";
import ValueProposition from "@/components/ValueProposition";
import Footer from "@/components/Footer";
import { useJobsRealtime } from "@/hooks/useJobsRealtime";

const Index = () => {
  // Subscribe to realtime job changes for automatic cache invalidation
  useJobsRealtime();
  
  const [searchFilters, setSearchFilters] = useState<{
    title?: string;
    location?: string;
    employmentType?: string;
  }>({ employmentType: "vollzeit" });

  const handleSearch = (filters: { title: string; location: string; employmentType?: string }) => {
    setSearchFilters({ 
      title: filters.title || undefined,
      location: filters.location || undefined,
      employmentType: filters.employmentType 
    });
    // Scroll to results
    const resultsSection = document.getElementById("job-results");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroSection onSearch={handleSearch} />
        <VisualFeatureCards onScrollToJobs={() => {
          const resultsSection = document.getElementById("job-results");
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: "smooth" });
          }
        }} />
        <FeaturedJobs />
        <FeatureCards />

        <div id="job-results">
          <JobResults searchFilters={searchFilters} />
        </div>

        
        <WhyKanzleistelle />
        <ValueProposition />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
