export const metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <main className="p-0">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Impressum</h1>

      <section className="prose prose-sm max-w-none text-gray-800">
        <p><strong>ExaSim</strong><br />
          Donaublick 12<br />
          94575 Windorf<br />
          Deutschland
        </p>

        <p>
          Vertreten durch: <strong>Daniel Spitzl</strong><br />
          E-Mail: <a href="mailto:webmaster@exasim.de">webmaster@exasim.de</a>
        </p>

      

        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte verantwortlich.
          Nach §§ 8 bis 10 TMG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte
          fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
          rechtswidrige Tätigkeit hinweisen.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.
        </p>

        <h2>Hinweis</h2>
        <p>
          ExaSim stellt keine medizinische Beratung oder Behandlung dar. Inhalte dienen ausschließlich der
          Lehre/Prüfungsvorbereitung und ersetzen keine ärztliche Beratung.
        </p>
      </section>
    </main>
  );
}