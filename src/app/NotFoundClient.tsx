"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  // Darf hier ruhig useSearchParams nutzen — wir rendern sie ja in Suspense
  const search = useSearchParams(); 
  const tried = search.get("q");

  return tried ? (
    <p className="text-sm text-gray-500">Gesucht: „{tried}“</p>
  ) : null;
}