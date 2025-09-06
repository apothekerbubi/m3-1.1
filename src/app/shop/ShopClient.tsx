"use client";

export default function ShopClient() {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ExaSim Unlimited */}
      <div className="rounded-xl border bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">ExaSim Unlimited</h2>
          <p className="text-sm text-gray-600 mt-2">
            Mit <strong>ExaSim Unlimited</strong> erhältst du vollen Zugriff auf
            alle aktuellen und zukünftigen Fälle, inklusive unserer stetig
            wachsenden <strong>Premium-Simulationen</strong>. Perfekt für alle, die ihre
            Examensvorbereitung auf das nächste Level heben wollen – ohne
            Einschränkungen, jederzeit verfügbar. Dazu bekommst du Zugriff auf
            unsere Detailanalysen und exklusive Zusatzmaterialien,
            die dich optimal durch die gesamte Prüfungsphase begleiten.
          </p>
        </div>
        <div className="flex flex-col justify-end p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <OptionButton
              label="1 Monat"
              price="9,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
            <OptionButton
              label="2 Monate"
              price="18,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
            <OptionButton
              label="3 Monate"
              price="26,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
            <OptionButton
              label="6 Monate"
              price="49,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
          </div>
        </div>
      </div>

      {/* ExaSim Essentials */}
      <div className="rounded-xl border bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">ExaSim Essentials</h2>
          <p className="text-sm text-gray-600 mt-2">
            Starte deine Vorbereitung mit <strong>ExaSim Essentials</strong>.
            Dieses Paket bietet dir Zugang zu einer festen Anzahl an Fällen –
            perfekt, wenn du dich auf bestimmte Themen fokussieren oder das
            ExaSim-Training zunächst ausprobieren möchtest. Lerne praxisnah,
            erhalte direktes Feedback und steigere Schritt für Schritt deine
            Sicherheit. Ideal für kürzere Vorbereitungsphasen oder zur
            gezielten Vertiefung einzelner Schwerpunkte. Examenssimulation nicht inbegriffen.
          </p>
        </div>
        <div className="flex flex-col justify-end p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <OptionButton
              label="50 Fälle"
              price="4,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
            <OptionButton
              label="100 Fälle"
              price="8,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
            <OptionButton
              label="200 Fälle"
              price="14,99 €"
              onClick={() =>
                onUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionButton({
  label,
  price,
  onClick,
}: {
  label: string;
  price: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-sm text-gray-800 hover:border-blue-600 hover:text-blue-600 flex flex-col items-center"
    >
      <span className="font-medium">{label}</span>
      <span className="text-gray-600">{price}</span>
    </button>
  );
}