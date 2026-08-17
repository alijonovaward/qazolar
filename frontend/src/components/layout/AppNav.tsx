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
    <nav className="flex gap-2 overflow-x-auto border-b border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-9 shrink-0 items-center rounded-full px-4 font-medium transition-colors ${
              active
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
