import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const regions = [
  { name: "Berlin", count: 45 },
  { name: "München", count: 38 },
  { name: "Hamburg", count: 32 },
  { name: "Frankfurt", count: 28 },
  { name: "Düsseldorf", count: 24 },
  { name: "Köln", count: 22 },
  { name: "Stuttgart", count: 19 },
  { name: "Leipzig", count: 15 },
];

const RegionalJobs = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Jobs nach Region
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Finden Sie Stellenangebote in Ihrer Nähe - wir haben Jobs in allen großen deutschen Städten.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {regions.map((region) => (
            <Card
              key={region.name}
              className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{region.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {region.count} Jobs
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegionalJobs;
