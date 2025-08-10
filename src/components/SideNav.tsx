"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  HomeIcon,
  AcademicCapIcon,
  UserCircleIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

type Item = {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
};

const NAV: Item[] = [
  { href: "/subjects", label: "Übersicht", icon: HomeIcon },
  { href: "/cases", label: "Examenssimulation", icon: AcademicCapIcon },
  { href: "/account", label: "Account", icon: UserCircleIcon },            // Platzhalter
  { href: "/info", label: "Kontakt & Info", icon: InformationCircleIcon },  // Platzhalter
  { href: "/shop", label: "Shop", icon: ShoppingBagIcon },                  // Platzhalter
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block">
      <div className="md:sticky md:top-20 w-[220px] rounded-xl bg-white/80 border border-black/10 shadow-sm p-2">
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  "hover:bg-black/[.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                  active ? "bg-black/[.04] text-gray-900" : "text-gray-700"
                )}
              >
                {/* feine aktive Leiste links */}
                <span
                  className={clsx(
                    "absolute left-0 top-1 bottom-1 w-1 rounded-r-md transition-opacity",
                    active ? "opacity-100 bg-brand-600" : "opacity-0 group-hover:opacity-50 bg-gray-300"
                  )}
                />
                <Icon className={clsx("h-5 w-5", active ? "text-brand-700" : "text-gray-500")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}