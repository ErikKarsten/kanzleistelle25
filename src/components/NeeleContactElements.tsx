import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import NeeleContactDrawer from "./NeeleContactDrawer";
import neeleImage from "@/assets/neele-ehlers.jpg";

/**
 * Sticky desktop card + mobile bottom bar for Neele Ehlers.
 * Renders globally — place once in App or layout.
 */
const NeeleContactElements = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      {/* ── Desktop: Floating card on right edge ── */}
      {!isMobile && (
        <div
          className="fixed bottom-8 right-6 z-40 w-72 bg-background border rounded-2xl shadow-xl p-5 flex flex-col items-center gap-4 hover:shadow-2xl transition-shadow cursor-pointer"
          onClick={() => setDrawerOpen(true)}
        >
          <img
            src={neeleImage}
            alt="Neele Ehlers"
            className="w-[140px] h-[140px] rounded-full object-cover ring-4 ring-primary/15 shadow-lg"
          />
          <div className="text-center">
            <p className="font-bold text-foreground text-base">Neele Ehlers</p>
            <p className="text-sm text-muted-foreground">Recruiting Managerin</p>
          </div>
          <Button className="w-full gap-2">
            <MessageCircle className="h-4 w-4" />
            Kontakt aufnehmen
          </Button>
        </div>
      )}

      {/* ── Mobile: Sticky bottom bar ── */}
      {isMobile && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-2 flex items-center gap-3 cursor-pointer"
          onClick={() => setDrawerOpen(true)}
        >
          <img
            src={neeleImage}
            alt="Neele Ehlers"
            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Fragen? Neele hilft weiter.</p>
          </div>
          <Button size="sm" className="shrink-0 text-xs">
            Kontakt
          </Button>
        </div>
      )}

      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
};

export default NeeleContactElements;
