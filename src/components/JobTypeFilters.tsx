import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Coins } from "lucide-react";

const jobTypes = [
  { id: "vollzeit", label: "Vollzeit", icon: Briefcase },
  { id: "teilzeit", label: "Teilzeit", icon: Clock },
  { id: "minijob", label: "Minijob", icon: Coins },
];

interface JobTypeFiltersProps {
  selectedType?: string;
  onTypeChange: (type: string | undefined) => void;
}

const JobTypeFilters = ({ selectedType, onTypeChange }: JobTypeFiltersProps) => {
  // Fetch job counts per employment type
  const { data: jobCounts } = useQuery({
    queryKey: ["job-counts-by-type"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("employment_type")
        .eq("is_active", true);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((job) => {
        const type = job.employment_type || "other";
        counts[type] = (counts[type] || 0) + 1;
      });
      return counts;
    },
  });

  const handleClick = (typeId: string) => {
    if (selectedType === typeId) {
      onTypeChange(undefined); // Deselect
    } else {
      onTypeChange(typeId);
    }
  };

  return (
    <section className="py-12 border-y bg-background">
      <div className="container">
        <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
          Suche nach Beschäftigungsart
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {jobTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const count = jobCounts?.[type.id] || 0;
            
            return (
              <Button
                key={type.id}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto py-4 px-6 flex flex-col items-center gap-2 transition-colors ${
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary hover:text-primary-foreground"
                }`}
                onClick={() => handleClick(type.id)}
              >
                <type.icon className="h-6 w-6" />
                <span className="font-medium">{type.label}</span>
                <span className="text-xs opacity-70">{count} Jobs</span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default JobTypeFilters;
