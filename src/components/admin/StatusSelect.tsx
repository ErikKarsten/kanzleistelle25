import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface StatusSelectProps {
  applicationId: string;
  currentStatus: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Neu",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  reviewed: {
    label: "Gesichtet",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  contacted: {
    label: "Kontaktiert",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  accepted: {
    label: "Angenommen",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  rejected: {
    label: "Abgelehnt",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

const StatusSelect = ({ applicationId, currentStatus }: StatusSelectProps) => {
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    if (error) {
      toast.error("Status konnte nicht geändert werden");
      return;
    }

    toast.success("Status aktualisiert");
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-applications"] });
  };

  const config = statusConfig[currentStatus] || statusConfig.pending;

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[140px] h-8 border-none p-0 focus:ring-0">
        <Badge className={config.className}>{config.label}</Badge>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusConfig).map(([value, { label }]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusSelect;
