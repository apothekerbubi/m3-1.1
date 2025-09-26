"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

type HeroBullet = {
  text: ReactNode;
  colorClass?: string;
};

type PageHeroProps = {
  badge: string;
  title: string;
  description?: ReactNode;
  bullets?: HeroBullet[];
  gradientClassName?: string;
  badgeClassName?: string;
  className?: string;
  overlayClassName?: string;
};

export default function PageHero({
  badge,
  title,
  description,
  bullets,
  gradientClassName = "from-slate-900 via-slate-800 to-slate-700",
  badgeClassName = "border-white/20 bg-white/10 text-slate-200",
  className,
  overlayClassName = "bg-white/10",
}: PageHeroProps) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r px-6 py-12 text-white shadow-xl sm:px-8",
        gradientClassName,
        className,
      )}
    >
      <div className={clsx("absolute inset-y-0 right-0 w-1/2 blur-3xl", overlayClassName)} />
      <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <span
            className={clsx(
              "inline-flex items-center rounded-full border px-4 py-1 text-xs uppercase tracking-[0.2em]",
              badgeClassName,
            )}
          >
            {badge}
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-100/80 sm:text-base">{description}</p>
          ) : null}
        </div>
        {bullets && bullets.length > 0 ? (
          <ul className="grid gap-3 text-sm text-slate-100/90 sm:w-[22rem] sm:justify-items-end">
            {bullets.map((bullet, idx) => (
              <li
                key={idx}
                className="grid grid-cols-[auto,1fr] items-center gap-3 text-left sm:text-right"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <span
                    className={clsx("h-2.5 w-2.5 rounded-full", bullet.colorClass ?? "bg-slate-100")}
                  />
                </span>
                <span className="text-sm leading-snug text-slate-100/90 sm:text-right">
                  {bullet.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
