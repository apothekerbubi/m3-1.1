"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  HomeIcon,
  AcademicCapIcon,
  UserCircleIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon, // Icon fürs Auf-/Zuklappen
} from "@heroicons/react/24/outline";

type Item = {
  href: string;
  label: string;
  icon?: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  children?: Item[];
};

const NAV: Item[] = [
  { href: "/overview", label: "Übersicht", icon: HomeIcon },
  { href: "/subjects", label: "Bibliothek", icon: BookOpenIcon },
  { href: "/cases", label: "Leitsymptome", icon: ClipboardDocumentListIcon },
  { href: "/pruefung", label: "Prüfungsmodus", icon: ChatBubbleLeftRightIcon },
  { href: "/simulate", label: "Examenssimulation", icon: AcademicCapIcon },
  { href: "/account", label: "Account", icon: UserCircleIcon },
  {
    href: "/info",
    label: "Kontakt & Info",
    icon: InformationCircleIcon,
    children: [
      { href: "/kontakt", label: "Kontakt" },
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
      { href: "/agb", label: "AGB" },
      { href: "/widerruf", label: "Widerruf" },
      { href: "/haftung", label: "Haftungsbeschränkung" },
    ],
  },
  { href: "/shop", label: "Shop", icon: ShoppingBagIcon },
];

export default function SideNav() {
  const pathname = usePathname();

  const infoItem = NAV.find((n) => n.href === "/info");
  const infoChildActive =
    infoItem?.children?.some((c) => pathname?.startsWith(c.href)) ?? false;

  const [infoOpen, setInfoOpen] = useState<boolean>(infoChildActive);

  useEffect(() => {
    if (infoChildActive) setInfoOpen(true);
  }, [infoChildActive]);

  return (

    <nav
     id="app-sidenav"
      className="w-[var(--nav-w)] rounded-xl bg-white/80 border border-black/10 shadow-sm p-2"
      aria-label="Hauptnavigation"
    >
      <ul className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, children }) => {
          const childActive = children?.some((c) => pathname?.startsWith(c.href)) ?? false;
          const active = pathname?.startsWith(href) || childActive;
          const isInfo = href === "/info";

          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  "hover:bg-black/[.03] focus:outline-none",
                  active ? "bg-black/[.04] text-gray-900" : "text-gray-700"
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "absolute left-0 top-1 bottom-1 w-1 rounded-r-md",
                    active ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-300"
                  )}
                />
                {Icon && (
                  <Icon className={clsx("h-5 w-5", active ? "text-brand-700" : "text-gray-500")} />
                )}
                <span className="truncate">{label}</span>

                {/* Kleines Symbol zum Auf-/Zuklappen (kein <button>, keine Outline-Styles) */}
                {children && isInfo && (
                  <span
                    tabIndex={0}
                    aria-expanded={infoOpen}
                    aria-controls="info-subnav"
                    aria-label={infoOpen ? "Unterpunkte einklappen" : "Unterpunkte aufklappen"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setInfoOpen((o) => o ? false : true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setInfoOpen((o) => !o);
                      }
                    }}
                    className="ml-auto inline-flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <ChevronDownIcon
                      className={clsx(
                        "h-4 w-4 transition-transform duration-200",
                        infoOpen ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </span>
                )}
              </Link>

              {children && isInfo && infoOpen && (
                <ul id="info-subnav" className="mt-1 ml-4 flex flex-col gap-1">
                  {children.map((child) => {
                    const childIsActive = pathname?.startsWith(child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={clsx(
                            "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            "hover:bg-black/[.03] focus:outline-none",
                            childIsActive ? "bg-black/[.04] text-gray-900" : "text-gray-700"
                          )}
                        >
                          <span
                            aria-hidden
                            className={clsx(
                              "absolute left-0 top-1 bottom-1 w-1 rounded-r-md",
                              childIsActive
                                ? "bg-blue-600"
                                : "bg-transparent group-hover:bg-gray-300"
                            )}
                          />
                          <span className="pl-5 truncate">{child.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}