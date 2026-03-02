import { useEffect, useState, useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  { id: "p1", label: "§ 1 Geltungsbereich" },
  { id: "p2", label: "§ 2 Leistungen" },
  { id: "p3", label: "§ 3 Vertragsschluss" },
  { id: "p4", label: "§ 4 Abnahme" },
  { id: "p5", label: "§ 5 Zahlungen" },
  { id: "p6", label: "§ 6 Laufzeit & Kündigung" },
  { id: "p7", label: "§ 7 Verzug" },
  { id: "p8", label: "§ 8 Verhalten" },
  { id: "p9", label: "§ 9 Schutzrechte" },
  { id: "p10", label: "§ 10 Haftung" },
  { id: "p11", label: "§ 11 Schlussbestimmungen" },
];

const AGB = () => {
  const [activeId, setActiveId] = useState("p1");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // pick the one closest to top
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
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Allgemeine Geschäftsbedingungen
                </h1>
                <p className="text-muted-foreground mt-1">
                  der <strong>Kanzleistelle24</strong>, Inhaber Erik Karsten, Christian-Pommer-Straße 58, 38112 Braunschweig
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Drucken / PDF
              </Button>
            </div>
          </div>

          {/* Mobile TOC — horizontal scroll */}
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Inhaltsverzeichnis
                </p>
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
              {/* §1 */}
              <section id="p1" ref={(el) => { sectionRefs.current["p1"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 1</span> Geltungsbereich
                </h3>
                <p className="mb-3">
                  (1) Die vorliegenden Allgemeinen Geschäftsbedingungen finden Anwendung auf die zwischen Ihnen und uns, der <strong>Kanzleistelle24</strong> (Inhaber Erik Karsten), Christian-Pommer-Str. 58, 38112 Braunschweig (nachfolgend „Anbieter"), geschlossenen Verträge, soweit nicht durch schriftliche Vereinbarungen zwischen Ihnen und uns ausdrücklich etwas anderes vereinbart wurde. Abweichende oder entgegenstehende Geschäftsbedingungen werden von uns nicht anerkannt, sofern wir diesen nicht ausdrücklich schriftlich zugestimmt haben. § 305b BGB bleibt unberührt.
                </p>
                <p>
                  (2) Unsere Dienstleistungsangebote richten sich ausschließlich an Unternehmer im Sinne des § 14 BGB. Wir können daher vor Vertragsschluss und auch im Nachgang verlangen, dass Sie uns Ihre Unternehmereigenschaft ausreichend nachweisen (z. B. durch Angabe Ihrer USt-IdNr. oder sonstige geeignete Nachweise). Die für den Nachweis erforderlichen Daten sind von Ihnen vollständig und wahrheitsgemäß anzugeben.
                </p>
              </section>

              {/* §2 */}
              <section id="p2" ref={(el) => { sectionRefs.current["p2"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 2</span> Leistungen von Kanzleistelle24
                </h3>
                <p className="mb-3">(1) Der Anbieter erbringt Beratungs- und Agenturdienstleistungen für klein- und mittelständische Unternehmen, insbesondere im Bereich des Onlinemarketings und der Mitarbeitergewinnung für Kanzleien.</p>
                <p className="mb-3">(2) Soweit nicht ausdrücklich schriftlich abweichend vereinbart, schuldet der Anbieter dabei nicht die Erbringung eines konkreten unternehmerischen Erfolgs auf Kundenseite, sondern lediglich die vereinbarte Dienstleistung an sich.</p>
                <p className="mb-3">(3) Der Kunde hat die ihm obliegenden Mitwirkungshandlungen stets vollständig und fristgemäß auf erstes Anfordern zu erbringen. Unterlässt der Kunde eine Mitwirkungshandlung und verhindert damit die Leistungserbringung, bleibt der Vergütungsanspruch des Anbieters unberührt.</p>
                <p className="mb-3">(4) In Bezug auf die zu erbringenden Dienstleistungen steht dem Anbieter ein Leistungsbestimmungsrecht nach § 315 BGB zu.</p>
                <p className="mb-3">(5) Der Anbieter ist berechtigt, geschuldete Leistungen auch von Erfüllungsgehilfen / Subunternehmern und auch von anderen Dritten erbringen zu lassen.</p>
                <p className="mb-3">(6) Der Anbieter weist darauf hin, dass Werbeplattformen wie Meta (Facebook, Instagram) und Google jederzeit dazu berechtigt sind, Werbekampagnen ohne Nennung von Gründen zu stoppen. Für ein solches Vorgehen ist der Anbieter nicht verantwortlich. Der Vergütungsanspruch bleibt unberührt.</p>
                <p className="mb-3">(7) Die <strong>Geld-zurück-Garantie</strong> erhält ein Kunde nur, wenn diese konkret in der Auftragsbestätigung genannt wird. Sie garantiert dem Kunden mindestens eine Einstellung eines Mitarbeiters. Die Garantie ist mit einer Karenzzeit von 3 Monaten verbunden (Nachsuche-Zeitraum).</p>
                <p className="mb-3">(8) Sollte sich während der Betreuungszeit ein Kandidat direkt beim Kunden bewerben, wird vermutet, dass diese Bewerbung durch die Kampagne von <strong>Kanzleistelle24</strong> zustande kam. Erfolgt eine Einstellung, gilt der Auftrag als erfüllt; ein Anspruch aus der Geld-zurück-Garantie besteht dann nicht.</p>
                <p className="mb-3">(9) Der Wortlaut „qualifizierte Bewerbungen" verspricht keine konkrete Anzahl. Der Anbieter garantiert keinen diesbezüglich bestimmten Erfolg der lancierten Werbekampagnen.</p>
                <p>(10) Der Kunde ist für die Rechtskonformität etwaiger Werbekampagnen (Anzeigen, Internetauftritte, Impressum, Datenschutz etc.) ausschließlich selbst verantwortlich.</p>
              </section>

              {/* §3 */}
              <section id="p3" ref={(el) => { sectionRefs.current["p3"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 3</span> Zustandekommen von Verträgen
                </h3>
                <p className="mb-3">(1) Der Vertragsschluss erfolgt durch Annahme des Angebots des Anbieters. Dies kann fernmündlich, schriftlich oder in Textform erfolgen. Fernmündliche Vertragsschlüsse werden nur nach Einwilligung aufgezeichnet.</p>
                <p>(2) Der Kunde erhält auf Wunsch eine Auftragsbestätigung, welche jedoch für den Vertragsschluss nicht konstitutiv ist.</p>
              </section>

              {/* §4 */}
              <section id="p4" ref={(el) => { sectionRefs.current["p4"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 4</span> Abnahmebedürftige Leistungen
                </h3>
                <p className="mb-3">(1) Die Leistungen unterfallen grundsätzlich dem Dienstvertragsrecht (nicht abnahmebedürftig). Sofern ausnahmsweise Werkvertragsrecht gilt, gelten die nachfolgenden Absätze zur Abnahme.</p>
                <p>(2) Eine Abnahme kann für Teilleistungen oder als Gesamtabnahme verlangt werden. Die Abnahme gilt als erfolgt, wenn der Kunde nicht innerhalb von 7 Werktagen nach Aufforderung schriftlich konkrete Mängel rügt.</p>
              </section>

              {/* §5 */}
              <section id="p5" ref={(el) => { sectionRefs.current["p5"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 5</span> Zahlungen, Preise und Bedingungen
                </h3>
                <p className="mb-3">(1) Die angegebenen Preise sind Nettopreise zuzüglich gesetzlicher Umsatzsteuer.</p>
                <p className="mb-3">(2) Zahlungen sind grundsätzlich 7 Tage nach Rechnungsstellung fällig. Einrichtungs- und Betreuungsgebühren entstehen mit Vertragsschluss. Bei Ratenzahlung/monatlicher Zahlung fallen 5 % Verwaltungskosten an.</p>
                <p className="mb-3">(3) Bei Lastschriftverfahren ist ein SEPA-Mandat zu erteilen.</p>
                <p className="mb-3">(4) Im Falle der Inanspruchnahme der <strong>Geld-zurück-Garantie</strong> gemäß § 2 (7) werden pro Monat 1.000 € für das Werbebudget einbehalten. Die Differenz wird innerhalb von 12 Wochen erstattet.</p>
                <p>(5) Kontaktiert der Kunde einen Kandidaten nicht innerhalb von 7 Tagen telefonisch und protokolliert dies nicht im bereitgestellten System (z. B. lead-table.com), erlischt die <strong>Geld-zurück-Garantie</strong> vollständig.</p>
              </section>

              {/* §6 */}
              <section id="p6" ref={(el) => { sectionRefs.current["p6"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 6</span> Laufzeit und Kündigung
                </h3>
                <p className="mb-3">(1) Die Laufzeit bezieht sich auf die Anzeigenlaufzeit. Kündigungen bedürfen der Textform.</p>
                <p className="mb-3">(2) Vorzeitige ordentliche Kündigungsrechte während der Festlaufzeit sind ausgeschlossen. Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt unberührt.</p>
                <p className="mb-3">(3) Um die <strong>Geld-zurück-Garantie</strong> geltend zu machen, ist eine Nachricht per E-Mail an <a href="mailto:info@kanzleistelle24.de" className="text-primary hover:underline">info@kanzleistelle24.de</a> oder per Post an die Christian-Pommer-Straße 58 innerhalb von 14 Tagen nach Laufzeitende erforderlich.</p>
                <p>(4) Im Garantiefall ist der Anbieter berechtigt, die Kampagne zweimal um die ursprüngliche Laufzeit zu verlängern, um die vereinbarte Einstellung zu liefern.</p>
              </section>

              {/* §7 */}
              <section id="p7" ref={(el) => { sectionRefs.current["p7"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 7</span> Verzug und Erfüllung
                </h3>
                <p className="mb-3">(1) Leistungsfristen beginnen erst nach Zahlungseingang und vollständiger Mitwirkung des Kunden.</p>
                <p>(2) Bei Zahlungsverzug können Leistungen eingestellt werden. Bei Ratenzahlungsverzug (2 Raten) kann der Vertrag außerordentlich gekündigt und Schadensersatz gefordert werden.</p>
              </section>

              {/* §8 */}
              <section id="p8" ref={(el) => { sectionRefs.current["p8"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 8</span> Verhalten und Rücksichtnahme
                </h3>
                <p>Der Kunde hat die üblichen Verhaltensweisen eines redlichen Kaufmanns zu gewährleisten. Rechtswidrige oder sachgrundlose öffentliche Äußerungen über den Anbieter werden zivilrechtlich verfolgt.</p>
              </section>

              {/* §9 */}
              <section id="p9" ref={(el) => { sectionRefs.current["p9"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 9</span> Schutz- und Nutzungsrechte
                </h3>
                <p className="mb-3">(1) Der Kunde gewährleistet, dass überlassene Materialien (Fotos etc.) frei von Rechten Dritter sind.</p>
                <p>(2) Der Kunde erhält für die Dauer der Laufzeit ein einfaches Nutzungsrecht an den Ergebnissen, sofern die Vergütung vollständig entrichtet wurde. Eine Weitergabe an Dritte ist untersagt.</p>
              </section>

              {/* §10 */}
              <section id="p10" ref={(el) => { sectionRefs.current["p10"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 10</span> Haftung
                </h3>
                <p className="mb-3">(1) Der Anbieter haftet nur für Vorsatz und grobe Fahrlässigkeit. Bei einfacher Fahrlässigkeit nur bei Verletzung von Leben, Körper, Gesundheit oder wesentlichen Vertragspflichten (Kardinalpflichten).</p>
                <p>(2) Die Haftung für Datenverlust wird auf den typischen Wiederherstellungsaufwand begrenzt.</p>
              </section>

              {/* §11 */}
              <section id="p11" ref={(el) => { sectionRefs.current["p11"] = el; }} className="scroll-mt-24">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  <span className="text-primary">§ 11</span> Schlussbestimmungen
                </h3>
                <p className="mb-3">(1) Es gilt ausschließlich das Recht der Bundesrepublik Deutschland.</p>
                <p className="mb-3">(2) Erfüllungsort und ausschließlicher Gerichtsstand für Kaufleute ist der Sitz des Anbieters (Braunschweig).</p>
                <p>(3) Sollte eine Bestimmung unwirksam sein, bleibt der Rest des Vertrages wirksam.</p>
              </section>

              {/* Footer note */}
              <div className="border-t pt-6 mt-10 text-sm text-muted-foreground">
                <p>Stand: März 2026</p>
                <p>© <strong>Kanzleistelle24</strong> – Vervielfältigung verboten.</p>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
