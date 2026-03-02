import { useEffect, useState, useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  { id: "s1", label: "1. Überblick" },
  { id: "s2", label: "2. Hosting" },
  { id: "s3", label: "3. Pflichtinfos" },
  { id: "s4", label: "4. Datenerfassung" },
  { id: "s5", label: "5. Analyse-Tools" },
];

const Datenschutz = () => {
  const [activeId, setActiveId] = useState("s1");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background print:bg-white">
        <div className="container py-12 px-4 sm:px-6">
          {/* Header */}
          <div className="max-w-5xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Datenschutzerklärung</h1>
              <Button variant="outline" size="sm" className="shrink-0 print:hidden" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Drucken / PDF
              </Button>
            </div>
          </div>

          {/* Mobile TOC */}
          <div className="md:hidden max-w-5xl mx-auto mb-8 print:hidden">
            <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
              {sections.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                    activeId === id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground border-border hover:text-primary hover:border-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Two-column layout */}
          <div className="max-w-5xl mx-auto flex gap-10">
            {/* Desktop TOC */}
            <aside className="hidden md:block w-56 shrink-0 print:hidden">
              <nav className="sticky top-24 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inhaltsverzeichnis</p>
                {sections.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                      activeId === id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <article className="flex-1 max-w-[800px] space-y-10 text-muted-foreground leading-relaxed">
              {/* 1 */}
              <section id="s1" ref={(el) => { sectionRefs.current["s1"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">1.</span> Datenschutz auf einen Blick
                </h3>
                <h4 className="font-semibold text-foreground mt-4 mb-1">Allgemeine Hinweise</h4>
                <p className="mb-3">
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                </p>
                <h4 className="font-semibold text-foreground mt-4 mb-1">Datenerfassung auf dieser Website</h4>
                <p>
                  Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber: <strong>Kanzleistelle24</strong>, Inhaber: Erik Karsten. Die Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.&nbsp;B. im Kontaktformular bei Neele). Andere Daten werden automatisch durch unsere IT-Systeme erfasst (technische Daten wie IP-Adresse oder Browser).
                </p>
              </section>

              {/* 2 */}
              <section id="s2" ref={(el) => { sectionRefs.current["s2"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">2.</span> Hosting und Infrastruktur
                </h3>
                <p className="mb-3">Wir hosten die Inhalte unserer Website bei folgenden Anbietern:</p>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Vercel (Frontend-Hosting)</h4>
                <p className="mb-3">
                  Anbieter ist die Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Vercel dient der Bereitstellung der Website-Oberfläche. Details entnehmen Sie der Datenschutzerklärung von Vercel:{" "}
                  <a href="https://vercel.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    https://vercel.com/legal/privacy
                  </a>.
                </p>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Supabase (Datenbank &amp; Backend)</h4>
                <p>
                  Anbieter ist die Supabase Inc., 970 Summer St, Stamford, CT 06905, USA. Wir nutzen Supabase zur Speicherung Ihrer Eingaben im Kontaktformular (Leads). Die Datenverarbeitung erfolgt auf Grundlage von Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO. Unser berechtigtes Interesse ist die sichere Speicherung und effiziente Verwaltung von Kundenanfragen. Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt.
                </p>
              </section>

              {/* 3 */}
              <section id="s3" ref={(el) => { sectionRefs.current["s3"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">3.</span> Allgemeine Hinweise und Pflichtinformationen
                </h3>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Hinweis zur verantwortlichen Stelle</h4>
                <p className="mb-3">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
                <div className="rounded-lg border bg-secondary/40 p-5 mb-4 text-sm space-y-1">
                  <p className="font-semibold text-foreground">Kanzleistelle24</p>
                  <p>Inhaber: Erik Karsten</p>
                  <p>Christian-Pommer-Straße 58</p>
                  <p>38112 Braunschweig</p>
                  <p className="mt-2">
                    E-Mail:{" "}
                    <a href="mailto:info@kanzleistelle24.de" className="text-primary hover:underline">
                      info@kanzleistelle24.de
                    </a>
                  </p>
                </div>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Speicherdauer</h4>
                <p>
                  Soweit keine speziellere Speicherdauer genannt wurde, verbleiben Ihre Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt (z.&nbsp;B. nach abgeschlossener Bearbeitung Ihrer Recruiting-Anfrage).
                </p>
              </section>

              {/* 4 */}
              <section id="s4" ref={(el) => { sectionRefs.current["s4"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">4.</span> Datenerfassung auf dieser Website
                </h3>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Kontaktformular / Recruiting-Anfrage</h4>
                <p className="mb-3">
                  Wenn Sie uns per Kontaktformular (z.&nbsp;B. über unsere Recruiting-Sektion mit Neele Ehlers) Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage bei uns in der Supabase-Datenbank gespeichert.
                </p>
                <p className="mb-3">
                  Innerhalb unseres Unternehmens werden diese Daten an die zuständige Recruiting-Verantwortliche, Neele Ehlers, zur Bearbeitung weitergeleitet. Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO (vorvertragliche Maßnahmen).
                </p>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Calendly (Terminbuchung)</h4>
                <p>
                  Für die Terminbuchung nutzen wir Calendly (Calendly LLC, USA). Die von Ihnen eingegebenen Daten werden für die Planung und Durchführung des Termins verwendet. Rechtsgrundlage ist Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO (Interesse an einfacher Terminvereinbarung). Calendly ist nach dem EU-US Data Privacy Framework zertifiziert.
                </p>
              </section>

              {/* 5 */}
              <section id="s5" ref={(el) => { sectionRefs.current["s5"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">5.</span> Analyse-Tools
                </h3>

                <h4 className="font-semibold text-foreground mt-4 mb-1">Google Tag Manager &amp; Google Analytics</h4>
                <p>
                  Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Wir nutzen diese Tools, um das Nutzerverhalten auf unserer Seite zu verstehen und zu optimieren. Der Einsatz erfolgt nur bei Ihrer ausdrücklichen Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO).
                </p>
              </section>

              {/* Footer note */}
              <div className="border-t pt-6 mt-10 text-sm text-muted-foreground">
                <p>© <strong>Kanzleistelle24</strong> – Alle Rechte vorbehalten.</p>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Datenschutz;
