"use client";

import Link from "next/link";

import { SetupWizard } from "@/components/setup/SetupWizard";

export default function SetupPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Boshlang&apos;ich sozlash</h1>
        <Link href="/dashboard" className="text-sm text-emerald-700 underline dark:text-emerald-400">
          Dashboardga o&apos;tish
        </Link>
      </div>

      <SetupWizard />
    </main>
  );
}
