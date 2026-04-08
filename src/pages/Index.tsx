import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VisualFeatureCards from "@/components/VisualFeatureCards";
import FeaturedJobs from "@/components/FeaturedJobs";
import FeatureCards from "@/components/FeatureCards";
import JobResults from "@/components/JobResults";

import WhyKanzleistelle from "@/components/WhyKanzleistelle";

import Footer from "@/components/Footer";
import { useJobsRealtime } from "@/hooks/useJobsRealtime";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  // Subscribe to realtime job changes for automatic cache invalidation
  useJobsRealtime();

  const { toast } = useToast();

  // Show logout success toast (once)
  useEffect(() => {
    if (sessionStorage.getItem("logout_success")) {
      sessionStorage.removeItem("logout_success");
      toast({ title: "Erfolgreich abgemeldet", description: "Bis bald! 👋" });
    }
  }, []);
  
  const [searchFilters, setSearchFilters] = useState<{
    title?: string;
    location?: string;
    employmentType?: string;
    radius?: number;
  }>({ employmentType: "vollzeit" });

  const handleSearch = (filters: { title: string; location: string; employmentType?: string; radius?: number }) => {
    setSearchFilters({ 
      title: filters.title || undefined,
      location: filters.location || undefined,
      employmentType: filters.employmentType,
      radius: filters.radius
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
        
      </main>

      <Footer />
    </div>
  );
};

export default Index;