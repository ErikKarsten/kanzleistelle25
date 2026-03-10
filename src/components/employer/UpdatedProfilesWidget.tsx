import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowRight, Zap } from "lucide-react";

interface UpdatedApplication {
  id: string;
  first_name: string | null;
  last_name: string | null;
  applicant_updated_at: string | null;
  jobs?: { title: string } | null;
}

interface UpdatedProfilesWidgetProps {
  updatedApplications: UpdatedApplication[];
  onViewProfile: (app: UpdatedApplication) => void;
}

const UpdatedProfilesWidget = ({ updatedApplications, onViewProfile }: UpdatedProfilesWidgetProps) => {
  if (updatedApplications.length === 0) return null;

  return (
    <Card className="mb-8 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </div>
          <span>Aktualisierte Bewerberprofile</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            {updatedApplications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {updatedApplications.slice(0, 5).map((app) => (
          <button
            key={app.id}
            onClick={() => onViewProfile(app)}
            className="w-full flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-secondary/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Zap className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {app.first_name} {app.last_name}
                  <span className="text-muted-foreground font-normal ml-1">hat das Profil aktualisiert</span>
                </p>
                {app.jobs?.title && (
                  <p className="text-xs text-muted-foreground truncate">{app.jobs.title}</p>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
        {updatedApplications.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            + {updatedApplications.length - 5} weitere aktualisierte Profile
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpdatedProfilesWidget;
