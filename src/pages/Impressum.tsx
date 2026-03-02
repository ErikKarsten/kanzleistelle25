import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, User } from "lucide-react";

const Impressum = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container max-w-3xl py-16 px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Impressum</h1>
          <p className="text-muted-foreground mb-10">Angaben gemäß § 5 DDG</p>

          <section className="mb-10">
            <p className="text-xl font-bold text-foreground">Kanzleistelle24</p>
            <p className="text-muted-foreground mt-1">Inhaber: Erik Karsten</p>
            <div className="flex items-start gap-2 mt-4 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>Christian-Pommer-Straße 58<br />38112 Braunschweig</span>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" strokeWidth={1.5} />
              Vertreten durch
            </h3>
            <p className="text-muted-foreground ml-7">Erik Karsten</p>
          </section>

          <section className="mb-10">
            <h3 className="text-lg font-semibold text-foreground mb-3">Kontakt</h3>
            <div className="rounded-lg border bg-secondary/40 p-5 space-y-3">
              <a href="tel:053039578751" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} />
                05303-9578751
              </a>
              <a href="mailto:info@kanzleistelle24.de" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} />
                info@kanzleistelle24.de
              </a>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-lg font-semibold text-foreground mb-2">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h3>
            <p className="text-muted-foreground leading-relaxed">
              Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil und sind dazu auch nicht verpflichtet.
            </p>
          </section>

          <hr className="my-10 border-border" />

          <h2 className="text-2xl font-bold text-foreground mb-8">Haftungsausschluss</h2>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-2">Haftung für Inhalte</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-2">Haftung für Links</h3>
            <p className="text-muted-foreground leading-relaxed">
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-2">Urheberrecht</h3>
            <p className="text-muted-foreground leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Impressum;
