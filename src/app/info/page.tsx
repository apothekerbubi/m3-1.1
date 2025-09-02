export const metadata = {
  title: "Info",
};

export default function InfoPage() {
  const items = [
    { href: "/kontakt", title: "Kontakt", desc: "So erreichst du uns." },
    { href: "/impressum", title: "Impressum", desc: "Angaben gemäß § 5 TMG." },
    { href: "/datenschutz", title: "Datenschutz", desc: "Informationen nach DSGVO." },
    { href: "/agb", title: "AGB", desc: "Allgemeine Geschäftsbedingungen." },
    { href: "/widerruf", title: "Widerruf", desc: "Widerrufsbelehrung & Musterformular." },
  ];

  return (
    <main className="p-0">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Kontakt &amp; Info</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <a
            key={it.href}
            href={it.href}
            className="block rounded-2xl border border-black/10 bg-white p-4 shadow-card hover:bg-black/[.02] transition"
          >
            <div className="text-lg font-semibold">{it.title}</div>
            <div className="text-sm text-gray-600">{it.desc}</div>
          </a>
        ))}
      </div>
    </main>
  );
}