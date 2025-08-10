"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties, type PropsWithChildren } from "react";

export default function LayoutVars({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isExam = pathname?.startsWith("/exam");
  // Nur im Prüfungsbereich SideNav fest auf 220px setzen
  const style: CSSProperties | undefined = isExam
    ? ({ ["--nav-w" as any]: "220px" } as CSSProperties)
    : undefined;

  return <div style={style}>{children}</div>;
}