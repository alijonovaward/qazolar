"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stats", label: "Statistika" },
  { href: "/zikr", label: "Zikrlar" },
  { href: "/social", label: "Do'stlar" },
  { href: "/setup", label: "Sozlash" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 overflow-x-auto border-b border-neutral-200 px-4 text-sm dark:border-neutral-800">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-11 shrink-0 items-center border-b-2 ${
              active
                ? "border-emerald-600 font-medium text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-neutral-500"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
