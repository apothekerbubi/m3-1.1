// src/components/CaseImagePublic.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  publicImageUrl,
  resolveStoragePath,
} from "@/lib/supabase/publicUrl";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Props = {
  path: string;
  alt: string;
  caption?: string;        // bleibt für Typ-Kompatibilität erhalten, wird aber NICHT gerendert
  width?: number;
  height?: number;
  bucket?: string;
  zoomable?: boolean;      // Klick-Overlay aktivieren
  thumbMaxHeight?: number; // Thumbnail-Höhe in px (Default 220)
};

const passthroughLoader = ({ src }: { src: string }) => src;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function CaseImagePublic({
  path,
  alt,
  // caption,              // absichtlich ungenutzt
  width = 1200,
  height = 900,
  bucket = "cases",
  zoomable = false,
  thumbMaxHeight = 220,
}: Props) {
  const resolvedPath = useMemo(
    () => resolveStoragePath(path, bucket),
    [path, bucket]
  );

  const publicSrc = useMemo(() => {
    try {
      return publicImageUrl(path, bucket);
    } catch {
      return path;
    }
  }, [path, bucket]);

  const [signedSrc, setSignedSrc] = useState<string | null>(null);
  const src = signedSrc ?? publicSrc;
  const [errored, setErrored] = useState(false);
  const [open, setOpen] = useState(false);

  // === Overlay Transform- und Interaktions-Status ===
  const stageRef = useRef<HTMLDivElement | null>(null); // nur der Bildbereich (Stage)
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Pinch-Zoom Tracking
  type P = { id: number; x: number; y: number };
  const activePointers = useRef<Map<number, P>>(new Map());
  const pinchInitial = useRef<{
    dist: number;
    scale: number;
    tx: number;
    ty: number;
  } | null>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 6;

  // Reset & Body-Scroll sperren wenn Overlay offen
  useEffect(() => {
    if (open) {
      setScale(1);
      setTx(0);
      setTy(0);
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = old;
      };
    }
  }, [open]);

  // ESC schließt Overlay
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Doppelklick: Zoom 1x ↔ 2x an Cursor
  function handleDoubleClick(e: React.MouseEvent) {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    zoomAtPoint(scale < 2 ? 2 : 1, { x: cx, y: cy });
  }

  // Wheel-Zoom — nur auf der Stage
  function handleWheel(e: React.WheelEvent) {
    if (!stageRef.current) return;
    e.preventDefault();
    const rect = stageRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const delta = -e.deltaY; // nach oben → rein
    const factor = Math.exp(delta * 0.0015);
    zoomAtPoint(clamp(scale * factor, MIN_SCALE, MAX_SCALE), { x: cx, y: cy });
  }

  // Pointer Events (Drag + Pinch) — nur auf der Stage
  function onPointerDown(e: React.PointerEvent) {
    if (!stageRef.current) return;
    stageRef.current.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2) {
      const pts = [...activePointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchInitial.current = { dist, scale, tx, ty };
      isDraggingRef.current = false;
      lastPosRef.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!stageRef.current) return;
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 2 && pinchInitial.current) {
      const pts = [...activePointers.current.values()];
      const distNew = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      const factor = distNew / (pinchInitial.current.dist || 1);
      const target = clamp(pinchInitial.current.scale * factor, MIN_SCALE, MAX_SCALE);

      // Zoom zum Stage-Zentrum
      const rect = stageRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const s = scale;
      const sPrime = target;
      const tNewX = tx + (1 - sPrime / s) * (cx - tx);
      const tNewY = ty + (1 - sPrime / s) * (cy - ty);

      setScale(sPrime);
      setTx(tNewX);
      setTy(tNewY);
      return;
    }

    // Drag/Pan
    if (isDraggingRef.current && lastPosRef.current) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setTx((p) => p + dx);
      setTy((p) => p + dy);
    }
  }

  function onPointerUpOrCancel(e: React.PointerEvent) {
    try { stageRef.current?.releasePointerCapture(e.pointerId); } catch {}
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size === 0) {
      isDraggingRef.current = false;
      lastPosRef.current = null;
      pinchInitial.current = null;
    } else if (activePointers.current.size === 1) {
      const last = [...activePointers.current.values()][0];
      isDraggingRef.current = true;
      lastPosRef.current = { x: last.x, y: last.y };
      pinchInitial.current = null;
    }
  }

  function zoomAtPoint(targetScale: number, cursor: { x: number; y: number }) {
    const newScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    const s = scale;
    const sPrime = newScale;
    const newTx = tx + (1 - sPrime / s) * (cursor.x - tx);
    const newTy = ty + (1 - sPrime / s) * (cursor.y - ty);
    setScale(sPrime);
    setTx(newTx);
    setTy(newTy);
  }

  // Styles
  const thumbStyles: React.CSSProperties = {
    maxHeight: thumbMaxHeight,
    width: "100%",
    height: "auto",
    objectFit: "contain",
    display: "block",
  };

  const transformStyle: React.CSSProperties = {
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    transformOrigin: "0 0",
    userSelect: "none",
    touchAction: "none",
    willChange: "transform",
    cursor: isDraggingRef.current ? "grabbing" : scale > 1 ? "grab" : "default",
  };

  useEffect(() => {
    setErrored(false);
  }, [src]);

  useEffect(() => {
    let cancelled = false;

    if (resolvedPath.kind !== "storage") {
      setSignedSrc(null);
      return;
    }

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setSignedSrc(null);
      return;
    }

    const { bucket: bucketName, objectPath } = resolvedPath;
    if (!objectPath) {
      setSignedSrc(null);
      return;
    }

    async function fetchSignedUrl() {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(objectPath, 60 * 60); // 1h gültig

        if (cancelled) return;

        if (error) {
          console.error("[CaseImagePublic] Signed URL fehlgeschlagen:", error);
          setSignedSrc(null);
          return;
        }

        if (data?.signedUrl) {
          setSignedSrc(data.signedUrl);
        } else {
          setSignedSrc(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[CaseImagePublic] Signed URL Exception:", err);
          setSignedSrc(null);
        }
      }
    }

    fetchSignedUrl();

    return () => {
      cancelled = true;
    };
  }, [resolvedPath]);

  const Thumb = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loader={passthroughLoader}
      unoptimized
      className="w-full h-auto object-contain"
      style={thumbStyles}
      sizes="(max-width: 768px) 100vw, 700px"
      onError={() => {
        console.error("[CaseImagePublic] next/image load error:", src);
        setErrored(true);
      }}
    />
  );

  const ThumbFallback = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      style={thumbStyles}
      onError={() => console.error("[CaseImagePublic] <img> load error:", src)}
    />
  );

  return (
    <figure className="my-4">
      <div className="relative overflow-hidden rounded-md border border-black/10">
        {zoomable ? (
          <button
            type="button"
            className="group relative block w-full cursor-zoom-in"
            onClick={() => setOpen(true)}
            title="Zum Vergrößern klicken"
          >
            {!errored ? Thumb : ThumbFallback}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-md bg-white/90 px-2 py-1 text-xs">🔍 Vergrößern</span>
            </span>
          </button>
        ) : (
          (!errored ? Thumb : ThumbFallback)
        )}
      </div>

      {/* KEINE Caption/URL unter dem Bild */}

      {/* === Overlay via Portal (immer ganz oben) === */}
      {zoomable && open && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[2147483647] bg-black/85" // absurd hoher z-index
          aria-modal="true"
          role="dialog"
          onClick={() => setOpen(false)} // Klick auf Hintergrund schließt
        >
          {/* Close-Button: immer sichtbar, unabhängig von Stacking-Contexts */}
          <button
            type="button"
            className="fixed right-4 top-4 z-[2147483647] inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            title="Schließen (Esc)"
            aria-label="Bild schließen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Schließen
          </button>

          {/* Stage: nur hier sind Pointer/Wheel aktiv */}
          <div className="flex h-full w-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div
              ref={stageRef}
              className="relative h-full w-full max-w-6xl overflow-hidden rounded-md bg-black/30 shadow-2xl"
              onWheel={handleWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUpOrCancel}
              onPointerCancel={onPointerUpOrCancel}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="block max-w-none select-none"
                style={transformStyle}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </figure>
  );
}