"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <span className="min-h-11 min-w-11" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Mavzuni almashtirish"
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-neutral-300 text-lg dark:border-neutral-700"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
