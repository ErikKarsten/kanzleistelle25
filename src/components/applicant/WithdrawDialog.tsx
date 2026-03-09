import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  jobTitle: string;
}

const WithdrawDialog = ({ open, onOpenChange, applicationId, jobTitle }: WithdrawDialogProps) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const queryClient = useQueryClient();

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "withdrawn" })
        .eq("id", applicationId);

      if (error) throw error;

      toast({ title: "Bewerbung zurückgezogen", description: "Die Kanzlei wurde informiert." });
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      onOpenChange(false);
    } catch {
      toast({ title: "Fehler", description: "Bewerbung konnte nicht zurückgezogen werden.", variant: "destructive" });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bewerbung zurückziehen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du deine Bewerbung für <strong>„{jobTitle}"</strong> wirklich zurückziehen? Die Kanzlei wird darüber informiert. Dieser Schritt kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWithdrawing}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Ja, zurückziehen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WithdrawDialog;
