"use client";
export default function ShopClient() {
  async function onUpgrade() {
    const res = await fetch("/api/stripe/create-checkout-session", { method: "POST" });
    const { url } = await res.json();
    if (url) location.href = url;
  }

  async function onManage() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) location.href = url;
  }

  return (
    <div className="rounded-xl border p-4 bg-white">
      <h2 className="text-lg font-semibold mb-2">ExaSim Pro</h2>
      <p className="text-sm text-gray-600 mb-3">Voller Zugriff auf alle Fälle & Features.</p>
      <div className="flex gap-2">
        <button onClick={onUpgrade} className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm">Jetzt abonnieren</button>
        <button onClick={onManage} className="rounded-md border px-3 py-2 text-sm">Abo verwalten</button>
      </div>
    </div>
  );
}