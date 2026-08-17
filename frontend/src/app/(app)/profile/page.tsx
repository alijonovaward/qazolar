"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { UsernameCard } from "@/components/profile/UsernameCard";
import { VisibilitySelector } from "@/components/profile/VisibilitySelector";
import { useMe } from "@/hooks/useMe";

export default function ProfilePage() {
  const { data: me, isLoading } = useMe();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Profil</h1>

      {isLoading || !me ? (
        <p className="text-sm text-neutral-500">Yuklanmoqda...</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Email</span>
              <span className="font-medium">{me.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">A&apos;zo bo&apos;lgan sana</span>
              <span>{new Date(me.created_at).toLocaleDateString("uz-UZ")}</span>
            </div>
          </div>

          <UsernameCard username={me.username} />
          <PersonalInfoCard gender={me.gender} birthDate={me.birth_date} />
          <VisibilitySelector value={me.follower_visibility} />

          <LogoutButton />
        </>
      )}
    </main>
  );
}
