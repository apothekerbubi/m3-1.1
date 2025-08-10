// src/app/twitter-image/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "M3 Mentor";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
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
    { width: 1200, height: 630 }
  );
}