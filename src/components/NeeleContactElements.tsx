import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import NeeleContactDrawer from "./NeeleContactDrawer";
import neeleImage from "@/assets/neele-ehlers.webp";

/**
 * Sticky desktop card + mobile bottom bar for Neele Ehlers.
 * Renders globally — place once in App or layout.
 */
const NeeleContactElements = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      {/* ── Desktop: Floating card on right edge ── */}
      {!isMobile && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            aria-label={collapsed ? "Kontaktkarte einblenden" : "Kontaktkarte ausblenden"}
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {!collapsed && (
            <div
              className="w-72 bg-card border border-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 flex flex-col items-center gap-4 hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition-shadow cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-300"
              onClick={() => setDrawerOpen(true)}
            >
              <img
                src={neeleImage}
                alt="Neele Ehlers – Recruiting Managerin"
                className="w-[150px] h-[150px] rounded-full object-cover ring-4 ring-primary/15 shadow-lg"
                loading="lazy"
                decoding="async"
              />
              <div className="text-center">
                <p className="font-bold text-foreground text-base leading-tight">
                  Neele Ehlers
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Recruiting Managerin
                </p>
              </div>
              <Button className="w-full gap-2" size="default">
                <MessageCircle className="h-4 w-4" />
                Nehmen Sie jetzt Kontakt auf
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile: Sticky bottom bar ── */}
      {isMobile && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-2.5 flex items-center gap-3 cursor-pointer"
          onClick={() => setDrawerOpen(true)}
        >
          <img
            src={neeleImage}
            alt="Neele Ehlers"
            className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 shrink-0 shadow-md"
            loading="lazy"
            decoding="async"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Neele Ehlers
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Fragen? Ich helfe Ihnen gerne weiter.
            </p>
          </div>
          <Button size="sm" className="shrink-0 text-xs gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Kontakt
          </Button>
        </div>
      )}

      <NeeleContactDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
};

export default NeeleContactElements;
