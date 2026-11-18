import { useEffect, useRef, useState } from "react";
import { Instagram, Play, Volume2, VolumeX } from "lucide-react";
import { announceInstagramPhoneVisible } from "@/lib/instagramPhoneEvents";

/**
 * Animiertes Handy im Startseiten-Kopf, das den neuesten Instagram-Beitrag zeigt.
 *
 * Für eine neue Folge nur diese drei Werte anpassen
 * (Video + Standbild liegen in /public/videos/).
 */
const POST_URL = "https://www.instagram.com/p/De_mgtDIry9/";
const VIDEO_SRC = "/videos/chrissy-talks.mp4";
const POSTER_SRC = "/videos/chrissy-talks.jpg";
const EPISODE_TITLE = "Chrissy talks";

const InstagramPhone = () => {
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Sichtbarkeit melden, damit Neeles Kontaktkarte das Handy nicht verdeckt
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      announceInstagramPhoneVisible(entry.isIntersecting);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      announceInstagramPhoneVisible(false);
    };
  }, []);

  return (
    // Äußere Ebene: fliegt von unten ein
    <div ref={rootRef} className="motion-safe:animate-phone-rise">
      {/* Innere Ebene: schüttelt sich danach kurz */}
      <div className="relative origin-bottom motion-safe:animate-phone-shake">
        {/* „Neu auf Instagram“-Hinweis */}
        <div className="absolute -top-3 -left-4 z-30 flex items-center gap-1.5 bg-white text-primary text-xs font-bold px-3 py-1.5 shadow-lg">
          <Instagram className="h-3.5 w-3.5" />
          Neu auf Instagram
        </div>

        {/* Gehäuse */}
        <div className="relative w-[220px] sm:w-[250px] aspect-[9/19] rounded-[2.6rem] bg-neutral-900 p-[9px] shadow-2xl ring-1 ring-white/15">
          {/* Seitentasten */}
          <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-neutral-700" />

          {/* Bildschirm */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-black">
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

            {videoFailed ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-primary to-[#001a38] text-white">
                <div className="mb-16 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                  <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
                </div>
              </div>
            ) : (
              <video
                className="h-full w-full object-cover"
                src={VIDEO_SRC}
                poster={POSTER_SRC}
                autoPlay
                muted={muted}
                loop
                playsInline
                preload="metadata"
                aria-label={`Video: ${EPISODE_TITLE}`}
                onError={() => setVideoFailed(true)}
              />
            )}

            {/* Kopfzeile wie bei Instagram */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent px-4 pt-9 pb-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white ring-2 ring-[#DCCBB9]">
                <img src="/favicon.svg" alt="" className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-white">kanzleistelle24</span>
            </div>

            {/* Ton an/aus */}
            {!videoFailed && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="absolute right-3 top-[4.25rem] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
                aria-label={muted ? "Ton einschalten" : "Ton ausschalten"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}

            {/* Fußzeile mit Link zum Beitrag */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-5 pt-12">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#DCCBB9]">Neue Folge</p>
              <p className="mb-3 text-base font-bold leading-tight text-white">{EPISODE_TITLE}</p>
              <a
                href={POST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 bg-white py-2 text-xs font-bold text-primary transition-colors hover:bg-[#DCCBB9]"
              >
                <Instagram className="h-4 w-4" />
                Auf Instagram ansehen
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramPhone;
