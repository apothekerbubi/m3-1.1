export const metadata = {
  title: "Kontakt",
};

export default function KontaktPage() {
  return (
    <main className="p-0">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Kontakt</h1>
      <p className="text-sm text-gray-700">
        ExaSim<br />
        Donaublick 12<br />
        94575 Windorf
      </p>

      <div className="mt-3 text-sm">
        E-Mail: <a className="text-blue-600 underline" href="mailto:webmaster@exasim.de">webmaster@exasim.de</a><br />
        
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Bitte nutzt diese E-Mail-Adresse für Support, Feedback oder rechtliche Anliegen.
      </p>
    </main>
  );
}