import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw, Search } from "lucide-react";

interface Job {
  id: string;
  title: string;
  employment_type: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface ApplicationFiltersProps {
  jobs: Job[];
  companies?: Company[];
  selectedJob: string;
  selectedType: string;
  selectedCompany?: string;
  searchQuery?: string;
  onJobChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onCompanyChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onReset?: () => void;
}

const employmentTypes = [
  { value: "all", label: "Alle Anstellungsarten" },
  { value: "Vollzeit", label: "Vollzeit" },
  { value: "Teilzeit", label: "Teilzeit" },
  { value: "Freelance", label: "Freelance" },
];

const ApplicationFilters = ({
  jobs,
  companies,
  selectedJob,
  selectedType,
  selectedCompany = "all",
  searchQuery = "",
  onJobChange,
  onTypeChange,
  onCompanyChange,
  onSearchChange,
  onReset,
}: ApplicationFiltersProps) => {
  const hasActiveFilters =
    selectedJob !== "all" ||
    selectedType !== "all" ||
    selectedCompany !== "all" ||
    searchQuery.trim() !== "";

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>

        {onCompanyChange && companies && (
          <Select value={selectedCompany} onValueChange={onCompanyChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Alle Kanzleien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kanzleien</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedJob} onValueChange={onJobChange}>
          <SelectTrigger className="w-full sm:w-[220px]">
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
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue placeholder="Anstellungsart" />
          </SelectTrigger>
          <SelectContent>
            {employmentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onSearchChange && (
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name suchen…"
              className="pl-8 h-9"
            />
          </div>
        )}

        {onReset && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApplicationFilters;
