// src/app/twitter-image/route.ts
import { ImageResponse } from "next/og";

export const runtime = "edge";            // OG images run best on edge
export const dynamic = "force-dynamic";   // don't try to pre-render/export
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "M3 Mentor";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",              // ✅ not "inline-flex"
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#0f1524",
          color: "#fff",
          padding: 64,
          fontSize: 56,
          lineHeight: 1.2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "#cde1ff",
              color: "#0b5cff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            M3
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>M3 Mentor</div>
        </div>

        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ marginTop: 12, fontSize: 28, color: "rgba(255,255,255,.85)" }}>
          Prüfungsnahe M3‑Simulation — Innere, Chirurgie & Wahlfach
        </div>
      </div>
    ),
    size
  );
}