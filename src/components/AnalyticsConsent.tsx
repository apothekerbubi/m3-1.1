"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";

const GA_MEASUREMENT_ID = "G-QGF2YLZD4P";
const STORAGE_KEY = "analytics-consent";

type ConsentChoice = "granted" | "denied";

type ConsentState = ConsentChoice | "unknown";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}


export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentState>("unknown");
  const [bannerVisible, setBannerVisible] = useState(false);

  const setGaDisable = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    (window as typeof window & Record<string, boolean>)[
      `ga-disable-${GA_MEASUREMENT_ID}`
    ] = value;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as
      | ConsentChoice
      | null;

    if (stored === "granted" || stored === "denied") {
      setConsent(stored);
      setBannerVisible(false);
      
    } else {
      setConsent("unknown");
      setBannerVisible(true);
       }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (consent === "granted") {
      setGaDisable(false);
      window.gtag?.("consent", "update", {
        ad_storage: "granted",
        analytics_storage: "granted",
      });
      window.gtag?.("js", new Date());
      window.gtag?.("config", GA_MEASUREMENT_ID);
    } else {
      setGaDisable(true);
        window.gtag?.("consent", "update", {
        ad_storage: "denied",
        analytics_storage: "denied",
      });
    }
 }, [consent, setGaDisable]);

  const handleChoice = useCallback(
    (choice: ConsentChoice) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, choice);
      }
      setConsent(choice);
      setBannerVisible(false);
      
    },
   []
  );

  return (
    <>
       <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied'
          });
        `}
      </Script>

      {bannerVisible && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-[var(--fg)] px-6 py-4 text-[var(--bg)] shadow-lg">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between">
            <p className="sm:max-w-3xl">
              Wir nutzen Google Analytics, um anonymisierte Nutzungsstatistiken zu
              erfassen und unsere Inhalte zu verbessern. Dabei können Daten (inkl.
              IP-Adresse in gekürzter Form) an die Google LLC in die USA
              übermittelt werden. Details zu Zwecken, Speicherdauer und
              Widerrufsrechten findest du in unserer
              {" "}
              <a
                href="/datenschutz"
                className="underline decoration-transparent transition hover:decoration-current"
              >
                Datenschutzerklärung
              </a>
              . Bitte stimme der Verarbeitung zu oder lehne sie ab.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleChoice("denied")}
                className="rounded border border-current px-3 py-1 font-medium transition hover:bg-[var(--bg)] hover:text-[var(--fg)]"
              >
                Ablehnen
              </button>
              <button
                type="button"
                onClick={() => handleChoice("granted")}
                className="rounded bg-[var(--bg)] px-3 py-1 font-medium text-[var(--fg)] transition hover:opacity-80"
              >
                Zustimmen
              </button>
            </div>
          </div>
        </div>
      )}

      {!bannerVisible && consent !== "unknown" && (
        <button
          type="button"
          onClick={() => setBannerVisible(true)}
          className="fixed bottom-4 right-4 z-40 rounded-full border border-[var(--fg)] bg-[var(--bg)] px-4 py-2 text-xs font-medium text-[var(--fg)] shadow-md transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)]"
          aria-label="Cookie-Einstellungen öffnen"
        >
          Cookie-Einstellungen
        </button>
      )}
    </>
  );
}