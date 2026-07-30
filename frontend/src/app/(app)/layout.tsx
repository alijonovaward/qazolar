import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { AppNav } from "@/components/layout/AppNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <span className="font-semibold">QazoNamoz</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      <AppNav />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
