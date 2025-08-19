// next.config.ts
import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseHost = new URL(supabaseUrl).hostname; // -> paipgrtwdfakzxhsuqog.supabase.co

const nextConfig: NextConfig = {
  images: {
    // erlaubt alle Public-Objekte aus deinem Supabase-Bucket
    remotePatterns: [
      {
        protocol: "https",
        hostname: "paipgrtwdfakzxhsuqog.supabase.co",                 // ❌ kein "https://", nur Hostname
        pathname: "/storage/v1/object/public/**", // ❗ mit **, sonst matcht es nicht
      },
    ],
    // optional zusätzlich – schadet nicht und hilft bei manchen Setups
    domains: [supabaseHost],
  },
};

export default nextConfig;