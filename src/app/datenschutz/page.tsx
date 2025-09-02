export const metadata = {
  title: "Datenschutz",
};

export default function DatenschutzPage() {
  return (
    <main className="p-0">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Datenschutzerklärung</h1>

      <section className="prose prose-sm max-w-none text-gray-800">
        <h2>Verantwortlicher</h2>
        <p>
          ExaSim, Donaublick 12, 94565 Windorf, Deutschland<br />
          Vertreter: Daniel Spitzl<br />
          E-Mail: <a href="mailto:info@exasim.de">info@exasim.de</a>
        </p>

        <h2>Hosting</h2>
        <p>
          Diese Website wird bei Vercel gehostet. Beim Aufruf werden technische Zugriffsdaten
          (z. B. IP-Adresse, Datum/Uhrzeit, User-Agent) verarbeitet, um die Auslieferung zu ermöglichen
          und die Sicherheit zu gewährleisten.
        </p>

        <h2>Registrierung, Authentifizierung & Nutzungsdaten</h2>
        <p>
          Für die Nutzung von ExaSim ist ggf. eine Registrierung notwendig. Wir nutzen Supabase
          (Auth/DB), um Konten, Lernfortschritt (z. B. Fall-Score) und technische Logs zu verwalten.
          Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1
          lit. f DSGVO (berechtigtes Interesse an stabiler, sicherer Plattform).
        </p>

        <h2>Zahlungsabwicklung (Stripe)</h2>
        <p>
          Kostenpflichtige Leistungen werden über Stripe abgewickelt. Dabei verarbeitet Stripe
          u. a. Zahlungsdaten eigenverantwortlich. Weitere Infos: stripe.com/de/privacy.
        </p>

        <h2>Analyse (ohne Cookies)</h2>
        <p>
          Wir verwenden Plausible Analytics (EU/EWR, cookielos). Es werden keine personenbezogenen
          Profile erstellt. Daten werden aggregiert ausgewertet (z. B. Seitenaufrufe, Referrer).
        </p>

        <h2>Speicherdauer</h2>
        <p>
          Wir speichern Daten nur so lange, wie es zur Erfüllung der Zwecke erforderlich ist oder
          gesetzliche Pflichten bestehen.
        </p>

        <h2>Betroffenenrechte</h2>
        <p>
          Sie haben Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit
          sowie Widerspruch. Hierzu genügt eine E-Mail an <a href="mailto:webmaster@exasim.de">webmaster@exasim.de</a>.
        </p>

        <h2>Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz erreichen Sie uns unter <a href="mailto:webmaster@exasim.de">webmaster@exasim.de</a>.
        </p>

        <p className="text-xs text-gray-500">
          Stand: {new Date().toLocaleDateString("de-DE")}
        </p>
      </section>
    </main>
  );
}