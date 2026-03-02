import genossenschaftLogo from "@/assets/steuerberatergenossenschaft-logo.webp";

const TrustBadge = () => {
  return (
    <section className="py-12 md:py-16 bg-background border-b border-border/40">
      <div className="container">
        <div className="flex flex-col items-center gap-5">
          <a
            href="https://www.dstg.de"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <img
              src={genossenschaftLogo}
              alt="Deutsche Steuerberatergenossenschaft – Mitglied"
              className="h-20 md:h-24 w-auto object-contain grayscale opacity-70 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
            />
          </a>
          <p className="text-xs md:text-sm text-muted-foreground tracking-wide">
            Stolzes Mitglied der Deutschen Steuerberatergenossenschaft
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustBadge;
