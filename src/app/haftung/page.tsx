import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Haftungsbeschränkung",
  description:
    "Haftungsausschluss und rechtliche Hinweise zu ExaSim – Lern- und Trainingszwecke, keine medizinische Beratung.",
};

export default function HaftungPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-3">
        Haftungsbeschränkung
      </h1>

      <div className="prose prose-sm sm:prose-base max-w-none text-gray-800">
        <p>
          Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt.
           <strong>ExaSim</strong> (Donaublick 12, 94575 Windorf) übernimmt jedoch keine Gewähr
          für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Inhalte.
          Die Nutzung der Inhalte der Website erfolgt auf eigene Gefahr der Nutzenden. Mit der
          Nutzung der Website ohne Registrierung kommt kein Vertragsverhältnis zwischen
          den Nutzenden und ExaSim zustande.
        </p>

        <h2 className="text-lg font-semibold mt-6">Zweck und Zielgruppe</h2>
        <p>
          Die bereitgestellten Inhalte und Informationen sind akademischer Natur und dienen
          ausschließlich Informations- und <strong>Lernzwecken</strong>. Sie richten sich an
          Medizinstudierende, Ärztinnen/Ärzte sowie sonstige im Gesundheitswesen tätige Personen.
        </p>

        <h2 className="text-lg font-semibold mt-6">Keine medizinische Beratung</h2>
        <p>
          Der Dienst von ExaSim ist zur beispielhaften Beurteilung fiktiver Fälle zu Lern- und
          Trainingszwecken geeignet. Er ist <strong>nicht</strong> dafür geeignet, reale Fälle zu
          diagnostizieren oder zu behandeln, und ersetzt <strong>keinesfalls</strong> eine ärztliche
          Konsultation. Bei medizinischen Anliegen – einschließlich der Auswahl von Medikamenten und
          Behandlungen – wenden Sie sich bitte immer an Ihre behandelnde Ärztin/Ihren behandelnden Arzt
          oder suchen Sie in dringenden Fällen umgehend medizinische Notfallhilfe.
        </p>

        <h2 className="text-lg font-semibold mt-6">Angaben zu Verfahren &amp; Dosierungen</h2>
        <p>
          Für Angaben zu diagnostischen oder therapeutischen Verfahren, Algorithmen, Anwendungen,
          Applikationsformen und Dosierungen übernimmt ExaSim keine Gewähr. Ob genannte Handelspräparate
          in der jeweiligen Indikation zugelassen sind, ist im Einzelfall zu prüfen. Jede Anwendung,
          Applikation oder Dosierung erfolgt auf eigene Verantwortung der Nutzenden. Angaben sind vor
          Einsatz anhand weiterer Quellen (Herstellerinformationen, Fachinformationen/Beipackzettel etc.)
          zu verifizieren. Soweit nicht anders angegeben, beziehen sich Dosierungen auf Erwachsene.
        </p>

        <h2 className="text-lg font-semibold mt-6">Verantwortung der Fachanwender</h2>
        <p>
          Für Ärztinnen/Ärzte und sonstige im Gesundheitswesen Tätige können die Inhalte
          informativen Charakter haben, dürfen jedoch <strong>nicht ausschließlich</strong> als Grundlage
          für Diagnosen oder Therapieentscheidungen dienen. Die Verantwortung für Anwendung,
          Auswertung und die Einhaltung berufsrechtlicher Vorgaben liegt bei den Fachanwendern.
        </p>


        <h2 className="text-lg font-semibold mt-6">Gesetze, Normen &amp; Verordnungen</h2>
        <p>
          Soweit Gesetze, Normen oder Verordnungen zitiert werden, übernimmt ExaSim keine Gewähr
          für Richtigkeit oder Aktualität. Im Zweifel sind die Originalquellen heranzuziehen.
        </p>

        <h2 className="text-lg font-semibold mt-6">Kein Erfolgversprechen</h2>
        <p>
          Die auf ExaSim angebotenen Dienste haben unterstützende Funktion bei der Vorbereitung
          auf Prüfungen, ersetzen aber nicht das eigenständige Lernen. ExaSim übernimmt keine
          Gewähr oder Garantie für das erfolgreiche Absolvieren von Prüfungen.
        </p>

        <h2 className="text-lg font-semibold mt-6">Externe Links</h2>
        <p>
          Trotz sorgfältiger Prüfung bei einer eventuellen Verlinkung oder Einbettung übernimmt
          ExaSim keine Haftung für Inhalte externer Websites. Für deren Inhalte sind ausschließlich
          die jeweiligen Betreiber verantwortlich.
        </p>

        <h2 className="text-lg font-semibold mt-6">Urheber- &amp; Leistungsschutzrechte</h2>
        <p>
          Die auf dieser Website veröffentlichten Inhalte unterliegen dem deutschen Urheber- und
          Leistungsschutzrecht. Jede nicht vom geltenden Recht zugelassene Verwertung bedarf der
          vorherigen schriftlichen Zustimmung von ExaSim oder der jeweiligen Rechteinhaber.
          Dies gilt insbesondere für Vervielfältigung, Bearbeitung, Übersetzung, Einspeicherung
          und Wiedergabe in Datenbanken oder anderen elektronischen Medien und Systemen.
          Die Darstellung dieser Website in fremden Frames ist nur mit schriftlicher Erlaubnis zulässig.
        </p>

        <p className="mt-6 text-xs text-gray-500">
          Verantwortlich: Daniel Spitzl, ExaSim, Donaublick 12, 94575 Windorf
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/info"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Zurück zu Kontakt &amp; Info
          </Link>
          <Link
            href="/impressum"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Datenschutz
          </Link>
        </div>
      </div>
    </main>
  );
}