import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";

interface UnreadMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
  onNavigate: () => void;
}

const UnreadMessagesModal = ({
  open,
  onOpenChange,
  unreadCount,
  onNavigate,
}: UnreadMessagesModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <MessageCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">
            Neue Nachrichten!
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {unreadCount === 1
              ? "1 Bewerber wartet auf eine Antwort."
              : `${unreadCount} Bewerber warten auf eine Antwort.`}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Ungelesene Nachrichten</p>
          <p className="text-3xl font-bold text-destructive">{unreadCount}</p>
        </div>

        <Button
          className="w-full mt-2"
          size="lg"
          onClick={() => {
            onOpenChange(false);
            onNavigate();
          }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Jetzt zu den Nachrichten
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UnreadMessagesModal;
