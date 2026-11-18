import { useEffect, useRef, useState } from "react";
import {
  BatteryFull,
  Camera,
  ChevronDown,
  Clapperboard,
  Heart,
  Home,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  PlusSquare,
  Search,
  Send,
  Signal,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";
import { announceInstagramPhoneVisible } from "@/lib/instagramPhoneEvents";

/**
 * Animiertes Handy im Startseiten-Kopf, das die neueste Instagram-Folge im Reels-Look zeigt.
 *
 * Für eine neue Folge nur diese Werte anpassen
 * (Video + Standbild liegen in /public/videos/).
 */
const POST_URL = "https://www.instagram.com/p/De_mgtDIry9/";
// Vorerst führt „Folgen“ zum Beitrag (dort kann man ebenfalls folgen),
// bis der genaue Profilname feststeht.
const PROFILE_URL = POST_URL;
const VIDEO_SRC = "/videos/chrissy-talks.mp4";
const POSTER_SRC = "/videos/chrissy-talks.jpg";
const EPISODE_TITLE = "Chrissy talks";
const CAPTION = "– die neue Folge ist da! 🎬";
const USERNAME = "kanzleistelle24";

/** Kleines rundes Profilbild mit der K24-Bildmarke */
const Avatar = ({ size = "h-7 w-7", ring = true }: { size?: string; ring?: boolean }) => (
  <span
    className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-white ${
      ring ? "ring-[1.5px] ring-white" : ""
    }`}
  >
    <img src="/favicon.svg" alt="" className="h-[60%] w-[60%]" />
  </span>
);

const iconShadow = "drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]";

const InstagramPhone = () => {
  const [muted, setMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video starten. Safari/iOS spielen nur automatisch ab, wenn das Video
  // nachweislich stumm ist – React setzt das muted-Attribut nicht selbst.
  const startVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) v.setAttribute("muted", "");
    v.play()
      .then(() => setAutoplayBlocked(false))
      .catch(() => setAutoplayBlocked(true)); // z. B. iPhone-Stromsparmodus
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.defaultMuted = true;
    v.muted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    startVideo();
    v.addEventListener("canplay", startVideo, { once: true });
    return () => v.removeEventListener("canplay", startVideo);
  }, [videoFailed]);

  // Ton-Schalter
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (muted) v.setAttribute("muted", "");
    else v.removeAttribute("muted");
  }, [muted]);

  // Sichtbarkeit: Neeles Kontaktkarte ausblenden und Video nur abspielen, solange sichtbar
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      announceInstagramPhoneVisible(entry.isIntersecting);
      const v = videoRef.current;
      if (!v) return;
      if (entry.isIntersecting) startVideo();
      else v.pause();
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
        <div className="relative w-[230px] sm:w-[255px] xl:[zoom:1.22] aspect-[9/19] rounded-[2.6rem] bg-neutral-900 p-[9px] shadow-2xl ring-1 ring-white/15">
          {/* Seitentasten */}
          <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-neutral-700" />

          {/* Bildschirm */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-black font-sans text-white">
            {/* Video-Fläche (über der unteren Navigationsleiste) */}
            <div className="absolute inset-x-0 top-0 bottom-11">
              {videoFailed ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-primary to-[#001a38]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                    <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  src={VIDEO_SRC}
                  poster={POSTER_SRC}
                  autoPlay
                  muted={muted}
                  loop
                  playsInline
                  preload="auto"
                  aria-label={`Video: ${EPISODE_TITLE}`}
                  onError={() => setVideoFailed(true)}
                />
              )}
              {/* Abdunklung oben/unten für lesbare Schrift */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />
            </div>

            {/* Ganzer Bildschirm öffnet den Beitrag */}
            <a
              href={POST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-x-0 top-0 bottom-11 z-[5]"
              aria-label={`${EPISODE_TITLE} auf Instagram ansehen`}
            />

            {/* Statusleiste + Dynamic Island */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 pt-[9px] text-[11px] font-semibold">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <Signal className="h-3 w-3" strokeWidth={2.5} />
                <Wifi className="h-3 w-3" strokeWidth={2.5} />
                <BatteryFull className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </div>
            <div className="pointer-events-none absolute top-2 left-1/2 z-20 h-5 w-[4.5rem] -translate-x-1/2 rounded-full bg-black" />

            {/* Reels-Kopfzeile */}
            <div className={`pointer-events-none absolute inset-x-0 top-9 z-10 flex items-center justify-between px-4 ${iconShadow}`}>
              <span className="flex items-center gap-0.5 text-[17px] font-bold tracking-tight">
                Reels <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <Camera className="h-[22px] w-[22px]" strokeWidth={1.8} />
            </div>

            {/* Falls der Browser automatisches Abspielen verhindert: Play-Knopf */}
            {!videoFailed && autoplayBlocked && (
              <button
                type="button"
                onClick={startVideo}
                className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/65"
                aria-label="Video abspielen"
              >
                <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" />
              </button>
            )}

            {/* Ton an/aus */}
            {!videoFailed && (
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="absolute right-3 top-[4.6rem] z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm hover:bg-black/60"
                aria-label={muted ? "Ton einschalten" : "Ton ausschalten"}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            )}

            {/* Aktionen rechts (nur Optik) */}
            <div
              className={`pointer-events-none absolute right-2.5 bottom-[3.6rem] z-10 flex flex-col items-center gap-4 ${iconShadow}`}
              aria-hidden="true"
            >
              <Heart className="h-[22px] w-[22px]" strokeWidth={1.8} />
              <MessageCircle className="h-[22px] w-[22px] -scale-x-100" strokeWidth={1.8} />
              <Send className="h-[21px] w-[21px]" strokeWidth={1.8} />
              <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.8} />
              <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-white bg-white">
                <img src="/favicon.svg" alt="" className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Profil, Beschreibung, Audio */}
            <div className={`absolute left-3 right-12 bottom-[3.4rem] z-10 ${iconShadow}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <Avatar />
                <span className="text-[12.5px] font-semibold">{USERNAME}</span>
                <a
                  href={PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/80 px-2 py-[1px] text-[11.5px] font-semibold hover:bg-white/15"
                >
                  Folgen
                </a>
              </div>
              <p className="pointer-events-none mb-1 line-clamp-2 text-[12px] leading-snug">
                <span className="font-semibold">{EPISODE_TITLE}</span> {CAPTION}
              </p>
              <p className="pointer-events-none flex items-center gap-1 truncate text-[11px] text-white/90">
                <Music2 className="h-3 w-3 shrink-0" />
                {USERNAME} · Originalton
              </p>
            </div>

            {/* Untere Navigationsleiste */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-11 items-start justify-around bg-black px-3 pt-2"
              aria-hidden="true"
            >
              <Home className="h-[21px] w-[21px]" strokeWidth={1.8} />
              <Search className="h-[21px] w-[21px]" strokeWidth={1.8} />
              <PlusSquare className="h-[21px] w-[21px]" strokeWidth={1.8} />
              <Clapperboard className="h-[21px] w-[21px]" strokeWidth={2.4} />
              <Avatar size="h-[22px] w-[22px]" />
              {/* Home-Indikator */}
              <span className="absolute bottom-1 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-white/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramPhone;
