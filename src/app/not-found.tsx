// src/app/not-found.tsx
import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";

export default function NotFound() {
  return (
    <Suspense fallback={<main className="p-6 text-gray-600">Lade…</main>}>
      <NotFoundClient />
    </Suspense>
  );
}