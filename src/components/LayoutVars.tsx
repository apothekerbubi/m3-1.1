"use client";
import React from "react";

type CSSVars = Record<`--${string}`, string | number>;

type LayoutVarsProps = {
  children: React.ReactNode;
  /** Optional: CSS-Custom-Properties, z. B. {"--nav-w":"220px"} */
  values?: CSSVars;
  /** Zusätzliche Klassen auf dem Wrapper */
  className?: string;
};

/**
 * Legt CSS-Custom-Properties auf einem Wrapper-<div> ab, damit
 * du sie in Tailwind/Styles verwenden kannst.
 */
export default function LayoutVars({ children, values, className }: LayoutVarsProps) {
  // React.CSSProperties erlaubt index signatures nicht direkt → casten:
  const style = (values ?? {}) as React.CSSProperties;
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}