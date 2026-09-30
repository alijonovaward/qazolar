import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">QazoNamoz</h1>
      {/* LoginForm reads ?next= via useSearchParams(), which Next.js requires
          a Suspense boundary for outside a fully dynamic route. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
