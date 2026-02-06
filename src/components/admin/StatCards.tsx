import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Briefcase } from "lucide-react";

interface StatCardsProps {
  totalApplications: number;
  newToday: number;
  openPositions: number;
}

const StatCards = ({ totalApplications, newToday, openPositions }: StatCardsProps) => {
  const stats = [
    {
      title: "Gesamtbewerbungen",
      value: totalApplications,
      icon: Users,
      description: "Alle eingegangenen Bewerbungen",
    },
    {
      title: "Neue Bewerbungen",
      value: newToday,
      icon: UserPlus,
      description: "Heute eingegangen",
    },
    {
      title: "Offene Stellen",
      value: openPositions,
      icon: Briefcase,
      description: "Aktive Stellenanzeigen",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-none shadow-md bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
