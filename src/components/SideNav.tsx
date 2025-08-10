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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const NAV: Item[] = [
  { href: "/subjects", label: "Übersicht",          icon: HomeIcon },
  { href: "/cases",    label: "Examenssimulation",  icon: AcademicCapIcon },
  { href: "/account",  label: "Account",            icon: UserCircleIcon },
  { href: "/info",     label: "Kontakt & Info",     icon: InformationCircleIcon },
  { href: "/shop",     label: "Shop",               icon: ShoppingBagIcon },
];

export default function SideNav() {
  const pathname = usePathname();
  return (
    // ⬇️ eigener Stacking-Context + feste Breite, verhindert „Auslaufen“
    <aside className="hidden md:block relative z-10 w-[220px]">
      <div className="sticky top-20 rounded-xl bg-white/80 border border-black/10 shadow-sm p-2">
        <nav className="flex flex-col gap-1">
          {/* ...deine Links */}
        </nav>
      </div>
    </aside>
  );

}