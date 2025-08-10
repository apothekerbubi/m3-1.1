/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(43,138,255,.20), transparent), #0b1020",
          color: "white",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, #2b8aff 0%, #8bc0ff 100%)",
              display: "grid",
              placeItems: "center",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            M3
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>M3 Mentor</div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.9, lineHeight: 1.25 }}>
          Prüfungsnahe M3-Simulation – Innere Medizin
        </div>
        <div style={{ marginTop: 18, fontSize: 20, opacity: 0.75 }}>
          Fälle · Fragen · direktes Feedback
        </div>
      </div>
    ),
    { ...size }
  );
}