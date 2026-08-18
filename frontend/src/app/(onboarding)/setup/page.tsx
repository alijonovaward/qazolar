"use client";

import { BackButton } from "@/components/layout/BackButton";
import { SetupWizard } from "@/components/setup/SetupWizard";

export default function SetupPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <BackButton href="/dashboard" label="Dashboardga qaytish" />
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">Boshlang&apos;ich sozlash</h1>
      </div>

      <SetupWizard />
    </main>
  );
}
