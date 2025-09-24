// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import LayoutVars from "@/components/LayoutVars";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";
import Script from "next/script";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "",
    template: "ExaSim | %s",
  },
  description: "Prüfungsnahe M3-Simulation – Innere, Chirurgie & Wahlfach",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <head>
         {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5GB3NKJV');`}
        </Script>
        <Script
           type="text/javascript"
          src="https://cdn.consentmanager.net/delivery/autoblocking/82049fe772b7e.js"
          data-cmp-ab="1"
           data-cmp-host="b.delivery.consentmanager.net"
          data-cmp-cdn="cdn.consentmanager.net"
           data-cmp-codesrc="0"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--fg)]">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5GB3NKJV"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <LayoutVars>
         
          <AppShell>{children}</AppShell>
        </LayoutVars>
      </body>
    </html>
  );
}