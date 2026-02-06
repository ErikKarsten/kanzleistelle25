import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedJobs from "@/components/FeaturedJobs";
import FeatureCards from "@/components/FeatureCards";
import JobResults from "@/components/JobResults";
import JobTypeFilters from "@/components/JobTypeFilters";
import RegionalJobs from "@/components/RegionalJobs";
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
  }>({});

  const handleSearch = (filters: { title: string; location: string; employmentType?: string }) => {
    setSearchFilters(prev => ({ 
      ...prev, 
      title: filters.title || undefined,
      location: filters.location || undefined,
      employmentType: filters.employmentType 
    }));
    // Scroll to results
    const resultsSection = document.getElementById("job-results");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEmploymentTypeChange = (type: string | undefined) => {
    setSearchFilters(prev => ({ ...prev, employmentType: type }));
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
        <FeaturedJobs />
        <FeatureCards />
        <JobTypeFilters 
          selectedType={searchFilters.employmentType} 
          onTypeChange={handleEmploymentTypeChange} 
        />

        <div id="job-results">
          <JobResults searchFilters={searchFilters} />
        </div>

        <RegionalJobs />
        <WhyKanzleistelle />
        <ValueProposition />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
