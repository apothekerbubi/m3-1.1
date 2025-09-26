"use client";

import PageHero from "@/components/PageHero";

type Option = {
  label: string;
  price: string;
  description?: string;
  priceId?: string;
  highlight?: boolean;
};

export default function ShopClient() {
   const caseBundles: Option[] = [
    {
      label: "25 Fälle",
      price: "3,99 €",
      description: "Perfekt zum Reinschnuppern in unsere Fallsimulationen.",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CASE_25,
    },
    {
      label: "50 Fälle",
      price: "6,99 €",
      description: "Vertiefe gezielt einzelne Fächer mit ausgewählten Fällen.",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CASE_50,
      highlight: true,
    },
    {
      label: "100 Fälle",
      price: "12,99 €",
      description: "Unser umfangreichstes Paket für fokussierte Lerneinheiten.",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CASE_100,
    },
  ];

  const subscriptions: Option[] = [
    {
      label: "1 Monat",
      price: "9,99 €",
      description: "Volle Flexibilität für kurze Intensivphasen.",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB_1M,
    },
    {
      label: "3 Monate",
      price: "26,99 €",
      description: "Beliebt für das Semesterendspurt – spare gegenüber dem Monatsplan.",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB_3M,
      highlight: true,
    },
    {
      label: "6 Monate",
      price: "49,99 €",
      description: "Langfristige Begleitung über alle Phasen deiner Vorbereitung.",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB_6M,
    },
  ];

  async function onUpgrade(priceId: string) {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    const { url } = await res.json();
    if (url) location.href = url;
  }

  return (
     <div className="space-y-16">
      <PageHero
        badge="ExaSim Shop"
        title="Finde das Modell, das zu deiner Prüfungsvorbereitung passt."
        description="Kombiniere flexibel Fallpakete mit unserem Unlimited-Abo. So kannst du genau dort trainieren, wo du gerade die größte Hebelwirkung brauchst."
        bullets={[
          { text: "Premium-Fälle & Simulationen aus allen Fächern", colorClass: "bg-emerald-300" },
          { text: "Sofortige Aktivierung nach dem Checkout", colorClass: "bg-amber-300" },
          { text: "Analyse-Dashboards & Feedback inklusive", colorClass: "bg-sky-300" },
          { text: "Kündbar und kombinierbar – ganz ohne Risiko", colorClass: "bg-fuchsia-300" },
        ]}
        gradientClassName="from-slate-900 via-slate-800 to-sky-800"
        overlayClassName="bg-gradient-to-b from-sky-400/40 via-cyan-400/30 to-emerald-400/40"
        badgeClassName="border-white/20 bg-white/10 text-sky-200"
        className="px-5 py-6 sm:px-6"
      />

       <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <ProductCard
          title="Fallpakete"
          subtitle="Hol dir eine kuratierte Auswahl an Fällen für gezielte Lernziele."
          badge="Flexibel"
          options={caseBundles}
          onSelect={onUpgrade}
        />
        <ProductCard
          title="ExaSim Unlimited"
          subtitle="Unbegrenzter Zugriff auf alle Fälle, Simulationen und neue Inhalte."
          badge="Abo"
          options={subscriptions}
          onSelect={onUpgrade}
        />
      </section>
    </div>
  );
}
function ProductCard({
  title,
  subtitle,
  badge,
  highlight,
  options,
  onSelect,
}: {
  title: string;
  subtitle: string;
  badge: string;
  highlight?: boolean;
  options: Option[];
  onSelect: (priceId: string) => void;
}) {
  return (
    <article
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border bg-white p-10 shadow-sm transition hover:shadow-lg ${
        highlight ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"
      }`}
    >
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-sky-500/40 to-violet-500/40 blur-3xl" />
      <div className="absolute bottom-4 right-6 text-7xl font-black text-black/5">
        {badge}
      </div>
      <div className="relative z-10">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
            highlight ? "bg-white/10 text-sky-200" : "bg-sky-100 text-sky-700"
          }`}
        >
          {badge}
        </span>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h2>
          <p className={`mt-3 text-sm leading-relaxed ${highlight ? "text-slate-100" : "text-slate-900"}`}>
          {subtitle}
        </p>
      </div>
      <div className="relative z-10 mt-8 space-y-4">
        {options.map((option) => (
          <OptionButton key={option.label} option={option} onSelect={onSelect} inverted={highlight} />
        ))}
      </div>
    </article>
  );
}

function OptionButton({
   option,
  onSelect,
  inverted,
}: {
  option: Option;
  onSelect: (priceId: string) => void;
  inverted?: boolean;
}) {
  const { label, price, description, priceId, highlight } = option;
  const disabled = !priceId;
  return (
    <button
        type="button"
      onClick={() => priceId && onSelect(priceId)}
      disabled={disabled}
      className={`group w-full rounded-2xl border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
        inverted
          ? "border-white/40 bg-white/10 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/50 focus-visible:ring-offset-slate-900"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-900/60 hover:shadow-md disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 focus-visible:ring-offset-white"
      } ${highlight ? "ring-1 ring-inset ring-sky-300/70" : ""}`}
    >
     <div className="flex items-center justify-between gap-6">
        <div>
          <div className="text-base font-semibold tracking-tight">{label}</div>
          {description && (
            <p className={`mt-1 text-sm ${inverted ? "text-slate-100" : "text-slate-900"}`}>
              {description}
            </p>
          )}
        </div>
        <div
          className={`text-lg font-semibold ${
            inverted ? "text-white" : "text-slate-900"
          }`}
        >
          {price}
        </div>
      </div>
      {disabled && (
        <p className={`mt-3 text-xs uppercase tracking-wider ${inverted ? "text-slate-200/70" : "text-slate-500/80"}`}>
          Bald verfügbar – kontaktiere uns für Zugang
        </p>
      )}
    </button>
  );
}