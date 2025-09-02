export const metadata = {
  title: "Widerruf",
};

export default function WiderrufPage() {
  return (
    <main className="p-0">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Widerrufsbelehrung</h1>

      <section className="prose prose-sm max-w-none text-gray-800">
        <h2>Widerrufsrecht</h2>
        <p>
          Verbraucher:innen haben bei Verträgen über die Lieferung digitaler Inhalte grundsätzlich
          ein Widerrufsrecht. Dieses erlischt jedoch, wenn wir mit der Ausführung begonnen haben,
          nachdem Sie ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der
          Ausführung beginnen, und Ihre Kenntnis vom Erlöschen des Widerrufsrechts bestätigt haben.
        </p>

        <h2>Folgen des Widerrufs</h2>
        <p>
          Wenn das Widerrufsrecht nicht erloschen ist und Sie widerrufen, erstatten wir alle Zahlungen,
          die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen 14 Tagen ab dem Tag,
          an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.
        </p>

        <h2>Muster-Widerrufsformular</h2>
        <p>Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück an:</p>
        <pre className="whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-3">
ExaSim
Donaublick 12
94575 Windorf
E-Mail: info@exasim.de
<p></p>
Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die Erbringung
der folgenden Dienstleistung:

— Bestellt am / erhalten am: ________________
— Name des/der Verbraucher(s): ________________
— Anschrift des/der Verbraucher(s): ________________
— Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
— Datum
        </pre>
      </section>
    </main>
  );
}