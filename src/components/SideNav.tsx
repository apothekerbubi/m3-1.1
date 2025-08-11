// src/components/SideNav.tsx
"use client";

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
  { href: "/account", label: "Account", icon: UserCircleIcon },
  { href: "/info", label: "Kontakt & Info", icon: InformationCircleIcon },
  { href: "/shop", label: "Shop", icon: ShoppingBagIcon },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      className="w-[var(--nav-w)] rounded-xl bg-white/80 border border-black/10 shadow-sm p-2"
      aria-label="Hauptnavigation"
    >
      <ul className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  "hover:bg-black/[.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                  active ? "bg-black/[.04] text-gray-900" : "text-gray-700"
                )}
              >
                {/* dezente aktive Leiste links, aber OHNE overflow */}
                <span
                  aria-hidden
                  className={clsx(
                    "absolute left-0 top-1 bottom-1 w-1 rounded-r-md",
                    active ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-300"
                  )}
                />
                <Icon className={clsx("h-5 w-5", active ? "text-brand-700" : "text-gray-500")} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}