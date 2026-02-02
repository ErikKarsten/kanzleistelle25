import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Users, GraduationCap } from "lucide-react";

const jobTypes = [
  { id: "vollzeit", label: "Vollzeit", icon: Briefcase, count: 124 },
  { id: "teilzeit", label: "Teilzeit", icon: Clock, count: 56 },
  { id: "freelance", label: "Freelance", icon: Users, count: 23 },
  { id: "praktikum", label: "Praktikum", icon: GraduationCap, count: 18 },
];

const JobTypeFilters = () => {
  return (
    <section className="py-12 border-y bg-background">
      <div className="container">
        <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
          Suche nach Beschäftigungsart
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {jobTypes.map((type) => (
            <Button
              key={type.id}
              variant="outline"
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <type.icon className="h-6 w-6" />
              <span className="font-medium">{type.label}</span>
              <span className="text-xs opacity-70">{type.count} Jobs</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobTypeFilters;
