import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Ro&apos;yxatdan o&apos;tish</h1>
      <RegisterForm />
    </main>
  );
}
