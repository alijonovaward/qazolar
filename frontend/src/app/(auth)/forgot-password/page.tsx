import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Parolni tiklash</h1>
      <ForgotPasswordForm />
    </main>
  );
}
