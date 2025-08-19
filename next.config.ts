// next.config.ts
import type { NextConfig } from "next";

// Env kann beim Build fehlen (z.B. lokal ohne .env.*) → sicher parsen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost: string | undefined;
try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
} catch {
  // ignorieren – wir fallen unten auf statische Patterns zurück
}

const nextConfig: NextConfig = {
  images: {
    // Erlaubt Bilder aus deinem öffentlichen Supabase-Bucket (konkreter Host)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "paipgrtwdfakzxhsuqog.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // optional dynamisch ergänzen, falls ENV vorhanden ist (sonst leeres Array)
    domains: supabaseHost ? [supabaseHost] : [],
  },
};

export default nextConfig;