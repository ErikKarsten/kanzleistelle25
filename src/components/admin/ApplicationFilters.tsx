import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface Job {
  id: string;
  title: string;
  employment_type: string | null;
}

interface ApplicationFiltersProps {
  jobs: Job[];
  selectedJob: string;
  selectedType: string;
  onJobChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

const employmentTypes = [
  { value: "all", label: "Alle Anstellungsarten" },
  { value: "Vollzeit", label: "Vollzeit" },
  { value: "Teilzeit", label: "Teilzeit" },
  { value: "Freelance", label: "Freelance" },
];

const ApplicationFilters = ({
  jobs,
  selectedJob,
  selectedType,
  onJobChange,
  onTypeChange,
}: ApplicationFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filter:</span>
      </div>
      
      <Select value={selectedJob} onValueChange={onJobChange}>
        <SelectTrigger className="w-full sm:w-[250px]">
          <SelectValue placeholder="Nach Job filtern" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Jobs</SelectItem>
          {jobs.map((job) => (
            <SelectItem key={job.id} value={job.id}>
              {job.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Nach Anstellungsart filtern" />
        </SelectTrigger>
        <SelectContent>
          {employmentTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ApplicationFilters;
